import Utils from './utils';

export default {
    /**
     * Loop through every post in a content response and flatten each one
     *
     * @param {array} content_posts - the results array returned from the endpoint
     * @param {boolean} onlyReturnValue - only return the value of the field, no position or id
     * @returns {array} - The new array of flattened objects
     */
    flattenContent(content_posts, onlyReturnValue = false){
        return content_posts.map(post => {
            return this.flattenContentObject(post, onlyReturnValue);
        });
    },

    /**
     * Flatten a content objects fields and datum
     *
     * @param {array} post - the post to flatten
     * @param {boolean} onlyReturnValue
     * @returns {array} - The new array of flattened objects
     */
    flattenContentObject(post, onlyReturnValue = false){
        return this.flattenContentObjectFields(post, onlyReturnValue);
    },

    /**
     * Flatten a content object
     *
     * @param {object} post - the results array returned from the endpoint
     * @param {boolean} onlyReturnValue
     * @returns {array} - The new array of flattened objects
     */
    flattenContentObjectFields(post, onlyReturnValue){
        let this_post = post;

        this_post.original = Utils.createObjectCopy(post);
        // Map the permissions to just return an array of IDs
        this_post.permissions = post.permissions ? post.permissions.map(permission => permission.permission_id) : null;

        this_post.duplicates = [];

        this_post['fields'].forEach(field => {
            this.createOrPushArray(field.key, field.value, field.id, field.position, this_post, onlyReturnValue, 'field');
        });

        this_post['data'].forEach(data => {
            this.createOrPushArray(data.key, data.value, data.id, data.position, this_post, onlyReturnValue, 'data');
        });

        return this_post;
    },

    /**
     * Flatten the filters returned from railcontent
     *
     * @param {object} filter_options - the filter_options object returned by railcontent
     * @returns {Object} - The new flattened object
     */
    flattenFilters(filter_options){
        let keys = Object.keys(filter_options);
        let filter_map = {
            artist: [],
            bpm: [],
            difficulty: [],
            instructor: [],
            style: [],
            focus: [],
            bands: [],
            endorsements: [],
            topic: [],
            key: [],
            key_pitch_type: [],
            essentials: [],
            creativity: [],
            theory: [],
            lifestyle: [],
            gear: [],
        };

        keys.forEach(key => {

            // Instructors need to have the name as the label but their id as the value,
            // So it makes sense to map every array as a key/value pair
            if(key === 'instructor'){
                let instructor_array = this.flattenContent(filter_options[key], true);

                instructor_array.forEach(filter => {

                    filter_map[key].push({
                        key: filter['name'],
                        value: filter['id']
                    });
                })
            }
            else {
                for(let i = 0; i < filter_options[key].length; i++){
                    // Some of the legacy data can give us duplicate keys,
                    // Since we can't avoid this we gotta check whether or not
                    // We've added the key already
                    let map_exists = filter_map[key] != null;
                    let value_exists;
                    if(map_exists){
                        value_exists = filter_map[key].filter(map =>
                            map.value === filter_options[key][i]
                        ).length > 0;

                        if(!value_exists){
                            filter_map[key].push({
                                key: filter_options[key][i],
                                value: filter_options[key][i]
                            });
                        }
                    }
                }
            }
        });

        return filter_map;
    },

    /**
     * If a value already exists when flattening an object, we need to turn it into an array
     * Will also utilize recursion to continue flattening nested objects
     *
     * @param key - the key of the field or data you wish to collapse
     * @param value - the value that gets appended to the target
     * @param id - the id of the datum or field property
     * @param position - the position property on the field/data
     * @param target - the target key you wish to create a value at or push to
     * @param {boolean} onlyReturnValue
     * @param dataOrField
     */
    createOrPushArray(key, value, id, position, target, onlyReturnValue, dataOrField){
        let this_value = onlyReturnValue ? value : {
            value: value,
            id: id,
            position: position
        };

        // If the value is an object that means we are looking at linked content as a field,
        // So we need to keep running this method to flatten that object aswell
        if(typeof value === 'object' && value !== null){
            value['fields'].forEach(field => {
                this.createOrPushArray(field.key, field.value, field.id, field.position, this_value, key === 'instructor', 'field');
            });

            value['data'].forEach(data => {
                this.createOrPushArray(data.key, data.value, data.id, data.position, this_value, key === 'instructor', 'data');
            });
        }

        // If a value is supposed to be an Array then make it one here
        if(target[key] == null && this.targetKeyShouldBeArray(key)){
            target[key] = [this_value];
        }
        else {
            // If target key is an array then we combine them using the spread operator
            if(Array.isArray(target[key])){
                target[key] = [
                    ...target[key],
                    this_value
                ]
            }
            else {
                // If a value isn't supposed to be an Array then dont take any duplicates
                if(target[key] == null){
                    target[key] = this_value;
                }
                else {
                    if(Array.isArray(target.duplicates)){
                        target.duplicates.push({
                            key: key,
                            value: value,
                            id: id,
                            type: dataOrField
                        });
                    }
                    else {
                        // If the duplicates array doesn't exist yet we need to make it
                        target.duplicates = [{
                            key: key,
                            value: value,
                            id: id,
                            type: dataOrField
                        }];
                    }
                }
            }
        }
    },

    /**
     * Determine whether a key for a content field should always be an array
     *
     * @param key
     */
    targetKeyShouldBeArray(key){
        return [
            'instructor',
            'tag',
            'topic',
            'resource_url',
            'resource_name',
            'sheet_music_image_url',
            'chapter_description',
            'chapter_timecode',
            'chapter_thumbnail_url',
            'key_pitch_type',
            'style',
            'focus',
            'bpm',
            'related_lesson',
            'essentials',
            'creativity',
            'theory',
            'lifestyle',
            'gear',
        ].indexOf(key) !== -1;
    },

    /**
     * Pull all of the top level content types, does not include child types
     *
     * @returns {array}
     */
    topLevelContentTypes(){
        return [
            {
                type: 'coach-stream',
                label: 'Coach Stream',
                icon: 'icon-student-focus',
                brands: ['drumeo'],
            },
            {
                type: 'course',
                label: 'Course',
                icon: 'icon-courses',
                brands: ['drumeo', 'guitareo', 'pianote', 'recordeo', 'singeo'],
            },
            {
                type: 'unit',
                label: 'Unit',
                icon: 'icon-courses',
                brands: ['pianote'],
            },
            {
                type: 'song',
                label: 'Song',
                icon: 'icon-songs',
                brands: ['drumeo', 'guitareo', 'pianote', 'recordeo', 'singeo'],
            },
            {
                type: 'song-pdf',
                label: 'Song PDF',
                icon: 'icon-songs',
                brands: ['guitareo'],
            },
            {
                type: 'song-tutorial',
                label: 'Song Tutorial',
                icon: 'icon-songs',
                brands: ['pianote'],
            },
            {
                type: 'play-along',
                label: 'Play-Along',
                icon: 'icon-play-alongs',
                brands: ['drumeo', 'guitareo', 'pianote'],
            },
            {
                type: 'student-focus',
                label: 'Student Focus',
                icon: 'icon-student-focus',
                brands: ['drumeo'],
            },
            {
                type: 'recording',
                label: 'Recording',
                icon: 'icon-library',
                brands: ['drumeo', 'guitareo', 'pianote', 'recordeo', 'singeo'],
            },
            {
                type: 'learning-path',
                label: 'Learning Path',
                icon: 'icon-learning-paths',
                brands: ['drumeo', 'guitareo', 'pianote', 'recordeo', 'singeo'],
            },
            {
                type: 'pack',
                label: 'Pack',
                icon: 'icon-packs',
                brands: ['drumeo', 'pianote', 'guitareo'],
            },
            {
                type: 'semester-pack',
                label: 'Semester Pack',
                icon: 'icon-packs',
                brands: ['drumeo', 'guitareo'],
            },
            {
                type: 'rudiment',
                label: 'Rudiment',
                icon: 'icon-drums',
                brands: ['drumeo'],
            },
            {
                type: 'chord-and-scale',
                label: 'Chords & Scales',
                icon: 'icon-chord-and-scale',
                brands: ['guitareo', 'pianote'],
            },
            {
                type: 'question-and-answer',
                label: 'Q & A',
                icon: 'icon-student-focus',
                brands: ['drumeo', 'recordeo', 'pianote', 'singeo', 'guitareo'],
            },
            {
                type: 'student-review',
                label: 'Student Review',
                icon: 'icon-student-focus',
                brands: ['recordeo', 'pianote', 'pianote', 'singeo', 'guitareo'],
            },
            {
                type: 'gear-guides',
                label: 'Gear Guides',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'challenges',
                label: 'Challenges',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'boot-camps',
                label: 'Boot Camps',
                icon: 'icon-shows',
                brands: ['drumeo', 'pianote', 'singeo'],
            },
            {
                type: 'quick-tips',
                label: 'Quick Tips',
                icon: 'icon-shows',
                brands: ['drumeo', 'pianote', 'singeo', 'guitareo'],
            },
            {
                type: 'podcasts',
                label: 'Podcasts',
                icon: 'icon-shows',
                brands: ['drumeo', 'pianote', 'singeo'],
            },
            {
                type: 'on-the-road',
                label: 'On the Road',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'behind-the-scenes',
                label: 'Behind the Scenes',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'study-the-greats',
                label: 'Study the Greats',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'live',
                label: 'Live',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'solos',
                label: 'Solos',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'performances',
                label: 'Performances',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'exploring-beats',
                label: 'Exploring Beats',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'sonor-drums',
                label: 'Sonor Drums',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'paiste-cymbals',
                label: 'Paiste Cymbals',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'rhythms-from-another-planet',
                label: 'Rhythms from Another Planet',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'the-history-of-electronic-drums',
                label: 'The History Of Electronic Drums',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'backstage-secrets',
                label: 'Backstage Secrets',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'spotlight',
                label: 'Spotlight',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: '25-days-of-christmas',
                label: '25 Days of Christmas',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'namm-2019',
                label: 'NAMM 2019',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'tama-drums',
                label: 'Tama Drums',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'student-collaborations',
                label: 'Student Collaborations',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'camp-drumeo-ah',
                label: 'Camp Drumeo-Ah',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'ha-oemurd-pmac',
                label: 'Ha-Oemurd-Pmac',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'diy-drum-experiments',
                label: 'DIY Drum Experiments',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'rhythmic-adventures-of-captain-carson',
                label: 'Rhythmic Adventures of Captain Carson',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'in-rhythm',
                label: 'In Rhythm',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'drum-fest-international-2022',
                label: '2022 Drum Fest International',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'assignment',
                label: 'Assignment',
                icon: 'icon-metronome',
                brands: ['drumeo', 'pianote', 'guitareo'],
            },
            {
                type: 'instructor',
                label: 'Instructor',
                icon: 'wc',
                brands: ['drumeo', 'pianote', 'guitareo', 'recordeo', 'singeo'],
            },
            {
                type: 'challenge',
                label: 'Challenge',
                icon: 'icon-courses',
                brands: ['drumeo', 'guitareo', 'pianote', 'recordeo', 'singeo'],
            },
            {
                type: 'challenge-part',
                label: 'Challenge Part',
                icon: 'icon-courses',
                brands: ['drumeo', 'guitareo', 'pianote', 'recordeo', 'singeo'],
            },
            {
                type: 'workout',
                label: 'Workout',
                icon: 'icon-courses',
                brands: ['drumeo', 'guitareo', 'pianote', 'recordeo', 'singeo'],
            },
            {
                type: 'artist',
                label: 'Artist',
                icon: 'wc',
                brands: ['drumeo', 'pianote', 'guitareo', 'recordeo', 'singeo'],
            },
            {
                type: 'style',
                label: 'Genre',
                icon: 'wc',
                brands: ['drumeo', 'pianote', 'guitareo', 'recordeo', 'singeo'],
            },
        ]
    },

    /**
     * Get a list of all types that have children per brand
     *
     * @returns {array}
     */
    getTypesWithChildrenByBrand(brand = 'drumeo'){
        const alwaysHasChildren = ['course', 'unit', 'learning-path', 'learning-path-level',
            'learning-path-course', 'pack', 'pack-bundle', 'semester-pack','challenge'];
        const types =  {
            drumeo: alwaysHasChildren,
            singeo: alwaysHasChildren,
            guitareo: [...alwaysHasChildren, 'play-along'],
            pianote: [...alwaysHasChildren, 'song-tutorial'],
            recordeo: alwaysHasChildren
        };

        return types[brand] || [];
    },

    /**
     * Get parent content type of a child type
     *
     * @param {string} childType
     * @returns {array}
     */
    getParentContentType(childType) {
        return {
            'course-part': 'course',
            'song-part': 'song',
            'play-along-part': 'play-along',
            'pack-bundle': 'pack',
            'pack-bundle-lesson': 'pack-bundle',
            'semester-pack-lesson': 'semester-pack',
            'unit-part': 'unit',
            'learning-path-level': 'learning-path',
            'learning-path-course': 'learning-path-level',
            'learning-path-lesson': 'learning-path-course',
            'song-tutorial-children': 'song-tutorial',
            'challenge-part': 'challenge',
        }[childType];
    },

    /**
     * Pull all of the top level content types, does not include child types
     *
     * @param {string} brand
     * @returns {array}
     */
    getBrandSpecificTopLevelContentTypes(brand){
        return this.topLevelContentTypes().filter(type =>
            type.type !== 'assignment' && type.brands.indexOf(brand) !== -1
        );
    },

    /**
     * Get the icon for a specific content type
     *
     * @param {string} type
     * @returns {string} - the icon class name
     */
    getContentTypeIcon(type){
        type = type
            .replace(/-part/g, '') // Remove the -part
            .replace(/-bundle/g, '') // Remove the -bundle
            .replace(/-level/g, '') // Remove the -level
            .replace(/-course/g, '') // Remove the -course
            .replace(/-lesson/g, '');  // Remove -lesson
        const contentType = this.topLevelContentTypes().filter(content =>
            content.type === type
        )[0];

        return contentType ? contentType.icon : undefined;
    },

    /**
     * Get a list of all show types
     *
     * @returns {array}
     */
    shows(){
        return [
            'recording',
            'gear-guides',
            'challenges',
            'boot-camps',
            'quick-tips',
            'podcasts',
            'on-the-road',
            'behind-the-scenes',
            'study-the-greats',
            'live',
            'solos',
            'performances',
            'exploring-beats',
            'sonor-drums',
            'paiste-cymbals',
            '25-days-of-christmas',
            'rhythms-from-another-planet',
            'the-history-of-electronic-drums',
            'backstage-secrets',
            'spotlight',
            'namm-2019',
            'entertainment',
            'tama-drums',
            'question-and-answer',
            'student-collaborations',
            'camp-drumeo-ah',
            'ha-oemurd-pmac',
            'diy-drum-experiments',
            'rhythmic-adventures-of-captain-carson',
            'in-rhythm',
            'drum-fest-international-2022',
        ];
    },

    /**
     * Get a list of all student focus types
     *
     * @returns {array}
     */
    studentFocus(){
        return [
            'quick-tips',
            'student-review',
            'question-and-answer',
            'boot-camps',
        ];
    },

    /**
     * Get a list of all searchable content types
     *
     * @returns {array}
     */
    searchableContentTypes() {
        return [
            {
                type: 'coach-stream',
                label: 'Coach Stream',
                icon: 'icon-student-focus',
                brands: ['drumeo', 'singeo'],
            },
            {
                type: 'recording',
                label: 'Recording',
                icon: 'icon-library',
                brands: ['drumeo', 'guitareo', 'pianote', 'recordeo', 'singeo'],
            },
            {
                type: 'course',
                label: 'Course',
                icon: 'icon-courses',
                brands: ['drumeo', 'guitareo', 'pianote', 'recordeo', 'singeo'],
            },
            {
                type: 'course-part',
                label: 'Course Part',
                icon: 'icon-library',
                brands: ['drumeo', 'guitareo', 'pianote', 'recordeo', 'singeo'],
            },
            {
                type: 'play-along',
                label: 'Play-Along',
                icon: 'icon-play-alongs',
                brands: ['drumeo', 'guitareo', 'pianote'],
            },
            {
                type: 'song',
                label: 'Song',
                icon: 'icon-songs',
                brands: ['drumeo', 'guitareo', 'pianote', 'recordeo', 'singeo'],
            },
            {
                type: 'song-pdf',
                label: 'Song PDF',
                icon: 'icon-songs',
                brands: ['guitareo'],
            },
            {
                type: 'student-focus',
                label: 'Student Focus',
                icon: 'icon-student-focus',
                brands: ['drumeo', 'singeo'],
            },
            {
                type: 'learning-path',
                label: 'Learning Path',
                icon: 'icon-learning-paths',
                brands: ['drumeo', 'guitareo', 'pianote', 'recordeo', 'singeo'],
            },
            {
                type: 'instructor',
                label: 'Instructor',
                icon: 'wc',
                brands: ['drumeo', 'pianote', 'guitareo', 'recordeo'],
            },
            {
                type: 'pack',
                label: 'Pack',
                icon: 'icon-packs',
                brands: ['drumeo', 'pianote', 'guitareo', 'singeo'],
            },
            {
                type: 'pack-bundle',
                label: 'Pack Bundle',
                icon: 'icon-shows',
                brands: ['drumeo', 'guitareo', 'pianote', 'recordeo', 'singeo'],
            },
            {
                type: 'pack-bundle-lesson',
                label: 'Pack Bundle Lesson',
                icon: 'icon-shows',
                brands: ['drumeo', 'guitareo', 'pianote', 'recordeo', 'singeo'],
            },
            {
                type: 'live',
                label: 'Live',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'gear-guides',
                label: 'Gear Guides',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'challenges',
                label: 'Challenges',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'boot-camps',
                label: 'Boot Camps',
                icon: 'icon-shows',
                brands: ['drumeo', 'pianote', 'singeo'],
            },
            {
                type: 'quick-tips',
                label: 'Quick Tips',
                icon: 'icon-shows',
                brands: ['drumeo', 'pianote', 'singeo'],
            },
            {
                type: 'podcasts',
                label: 'Podcasts',
                icon: 'icon-shows',
                brands: ['drumeo', 'pianote', 'singeo'],
            },
            {
                type: 'on-the-road',
                label: 'On the road',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'behind-the-scenes',
                label: 'Behind the Scenes',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'study-the-greats',
                label: 'Study the Greats',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'solos',
                label: 'Solos',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'performances',
                label: 'Performances',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'exploring-beats',
                label: 'Exploring Beats',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'independence-made-easy',
                label: 'Independence Made Easy',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'sonor-drums',
                label: 'Sonor Drums',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: '25-days-of-christmas',
                label: '25 Days of Christmas',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'rhythms-from-another-planet',
                label: 'Rhythms from Another Planet',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'the-history-of-electronic-drums',
                label: 'The History Of Electronic Drums',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'backstage-secrets',
                label: 'Backstage Secrets',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'spotlight',
                label: 'Spotlight',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'paiste-cymbals',
                label: 'Paiste Cymbals',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'namm-2019',
                label: 'NAMM 2019',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'tama-drums',
                label: 'Tama Drums',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'collaboration',
                label: 'Collaboration',
                icon: 'icon-shows',
                brands: ['drumeo'],
            },
            {
                type: 'learning-path-lesson',
                label: 'Learning Path Lesson',
                icon: 'icon-learning-paths',
                brands: ['drumeo', 'guitareo', 'pianote', 'recordeo', 'singeo'],
            },
            {
                type: 'learning-path-course',
                label: 'Learning Path Course',
                icon: 'icon-learning-paths',
                brands: ['drumeo', 'guitareo', 'pianote', 'recordeo', 'singeo'],
            },
            {
                type: 'learning-path-level',
                label: 'Learning Path Level',
                icon: 'icon-learning-paths',
                brands: ['drumeo', 'guitareo', 'pianote', 'recordeo', 'singeo'],
            },
            {
                type: 'artist',
                label: 'Artist',
                icon: 'wc',
                brands: ['drumeo', 'pianote', 'guitareo', 'recordeo', 'singeo'],
            },
            {
                type: 'style',
                label: 'Genre',
                icon: 'wc',
                brands: ['drumeo', 'pianote', 'guitareo', 'recordeo', 'singeo'],
            },
        ];
    },

    /**
     * Get a list of searchable content types by brand
     *
     * @param {string} brand
     * @returns {array}
     */
    getBrandSearchableContentTypes(brand) {
        return this.searchableContentTypes().filter(type =>
            type.brands.indexOf(brand) !== -1
        );
    },

    /**
     * Get a list of all content types that support statistics
     *
     * @returns {array}
     */
    statisticsContentTypes() {
        return [
            '25-days-of-christmas',
            'behind-the-scenes',
            'boot-camps',
            'camp-drumeo-ah',
            'challenges',
            'chord-and-scale',
            'course',
            'course-part',
            'diy-drum-experiments',
            'edge-pack',
            'entertainment',
            'exploring-beats',
            'gear-guides',
            'ha-oemurd-pmac',
            'in-rhythm',
            'learning-path',
            'learning-path-course',
            'learning-path-lesson',
            'learning-path-level',
            'live',
            'namm-2019',
            'on-the-road',
            'pack',
            'pack-bundle',
            'pack-bundle-lesson',
            'paiste-cymbals',
            'performances',
            'play-along',
            'play-along-part',
            'podcasts',
            'question-and-answer',
            'quick-tips',
            'recording',
            'rhythmic-adventures-of-captain-carson',
            'rhythms-from-another-planet',
            'the-history-of-electronic-drums',
            'backstage-secrets',
            'spotlight',
            'rudiment',
            'semester-pack',
            'semester-pack-lesson',
            'solos',
            'song',
            'song-part',
            'sonor-drums',
            'student-collaborations',
            'student-focus',
            'student-review',
            'study-the-greats',
            'tama-drums',
            'unit',
            'unit-part',
            'drum-fest-international-2022',
        ];
    }
}