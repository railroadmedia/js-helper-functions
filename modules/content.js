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
            topic: [],
            key: [],
            key_pitch_type: []
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
            'key_pitch_type'
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
                type: 'course',
                label: 'Course',
                icon: 'icon-courses',
                brands: ['drumeo', 'guitareo', 'pianote', 'recordeo'],
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
                brands: ['drumeo', 'guitareo', 'pianote', 'recordeo'],
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
                brands: ['drumeo', 'guitareo', 'pianote', 'recordeo'],
            },
            {
                type: 'learning-path',
                label: 'Learning Path',
                icon: 'icon-learning-paths',
                brands: ['drumeo', 'guitareo', 'pianote', 'recordeo'],
            },
            {
                type: 'pack',
                label: 'Pack',
                icon: 'icon-packs',
                brands: ['drumeo'],
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
                brands: ['drumeo', 'recordeo', 'pianote'],
            },
            {
                type: 'student-review',
                label: 'Student Review',
                icon: 'icon-student-focus',
                brands: ['recordeo', 'pianote'],
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
                brands: ['drumeo', 'pianote'],
            },
            {
                type: 'quick-tips',
                label: 'Quick Tips',
                icon: 'icon-shows',
                brands: ['drumeo', 'pianote'],
            },
            {
                type: 'podcasts',
                label: 'Podcasts',
                icon: 'icon-shows',
                brands: ['drumeo'],
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
                type: 'entertainment',
                label: 'Entertainment',
                icon: 'icon-shows',
                brands: ['guitareo'],
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
                brands: ['drumeo', 'pianote', 'guitareo', 'recordeo'],
            },
        ]
    },

    /**
     * Get a list of all types that have children per brand
     *
     * @returns {array}
     */
    getTypesWithChildrenByBrand(brand = 'drumeo'){
        const alwaysHasChildren = ['course', 'unit', 'learning-path', 'pack', 'pack-bundle', 'semester-pack'];
        const types =  {
            drumeo: alwaysHasChildren,
            guitareo: [...alwaysHasChildren, 'play-along', 'song'],
            pianote: [...alwaysHasChildren, 'song'],
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
            'namm-2019',
            'entertainment',
            'tama-drums',
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
}