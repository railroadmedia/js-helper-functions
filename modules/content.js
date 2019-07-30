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
            'key_pitch_type',
            'style',
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
                brands: ['drumeo', 'pianote'],
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
            'question-and-answer',
            'student-collaborations',
            'camp-drumeo-ah',
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
     * Get a list of all timezones
     *
     * @returns {array}
     */
    timezones(){
        return [
            'Europe/Andorra',
            'Asia/Dubai',
            'Asia/Kabul',
            'Europe/Tirane',
            'Asia/Yerevan',
            'Antarctica/Casey',
            'Antarctica/Davis',
            'Antarctica/DumontDUrville',
            'Antarctica/Mawson',
            'Antarctica/Palmer',
            'Antarctica/Rothera',
            'Antarctica/Syowa',
            'Antarctica/Troll',
            'Antarctica/Vostok',
            'America/Argentina/Buenos_Aires',
            'America/Argentina/Cordoba',
            'America/Argentina/Salta',
            'America/Argentina/Jujuy',
            'America/Argentina/Tucuman',
            'America/Argentina/Catamarca',
            'America/Argentina/La_Rioja',
            'America/Argentina/San_Juan',
            'America/Argentina/Mendoza',
            'America/Argentina/San_Luis',
            'America/Argentina/Rio_Gallegos',
            'America/Argentina/Ushuaia',
            'Pacific/Pago_Pago',
            'Europe/Vienna',
            'Australia/Lord_Howe',
            'Antarctica/Macquarie',
            'Australia/Hobart',
            'Australia/Currie',
            'Australia/Melbourne',
            'Australia/Sydney',
            'Australia/Broken_Hill',
            'Australia/Brisbane',
            'Australia/Lindeman',
            'Australia/Adelaide',
            'Australia/Darwin',
            'Australia/Perth',
            'Australia/Eucla',
            'Asia/Baku',
            'America/Barbados',
            'Asia/Dhaka',
            'Europe/Brussels',
            'Europe/Sofia',
            'Atlantic/Bermuda',
            'Asia/Brunei',
            'America/La_Paz',
            'America/Noronha',
            'America/Belem',
            'America/Fortaleza',
            'America/Recife',
            'America/Araguaina',
            'America/Maceio',
            'America/Bahia',
            'America/Sao_Paulo',
            'America/Campo_Grande',
            'America/Cuiaba',
            'America/Santarem',
            'America/Porto_Velho',
            'America/Boa_Vista',
            'America/Manaus',
            'America/Eirunepe',
            'America/Rio_Branco',
            'America/Nassau',
            'Asia/Thimphu',
            'Europe/Minsk',
            'America/Belize',
            'America/St_Johns',
            'America/Halifax',
            'America/Glace_Bay',
            'America/Moncton',
            'America/Goose_Bay',
            'America/Blanc-Sablon',
            'America/Toronto',
            'America/Nipigon',
            'America/Thunder_Bay',
            'America/Iqaluit',
            'America/Pangnirtung',
            'America/Atikokan',
            'America/Winnipeg',
            'America/Rainy_River',
            'America/Resolute',
            'America/Rankin_Inlet',
            'America/Regina',
            'America/Swift_Current',
            'America/Edmonton',
            'America/Cambridge_Bay',
            'America/Yellowknife',
            'America/Inuvik',
            'America/Creston',
            'America/Dawson_Creek',
            'America/Fort_Nelson',
            'America/Vancouver',
            'America/Whitehorse',
            'America/Dawson',
            'Indian/Cocos',
            'Europe/Zurich',
            'Africa/Abidjan',
            'Pacific/Rarotonga',
            'America/Santiago',
            'America/Punta_Arenas',
            'Pacific/Easter',
            'Asia/Shanghai',
            'Asia/Urumqi',
            'America/Bogota',
            'America/Costa_Rica',
            'America/Havana',
            'Atlantic/Cape_Verde',
            'America/Curacao',
            'Indian/Christmas',
            'Asia/Nicosia',
            'Asia/Famagusta',
            'Europe/Prague',
            'Europe/Berlin',
            'Europe/Copenhagen',
            'America/Santo_Domingo',
            'Africa/Algiers',
            'America/Guayaquil',
            'Pacific/Galapagos',
            'Europe/Tallinn',
            'Africa/Cairo',
            'Africa/El_Aaiun',
            'Europe/Madrid',
            'Africa/Ceuta',
            'Atlantic/Canary',
            'Europe/Helsinki',
            'Pacific/Fiji',
            'Atlantic/Stanley',
            'Pacific/Chuuk',
            'Pacific/Pohnpei',
            'Pacific/Kosrae',
            'Atlantic/Faroe',
            'Europe/Paris',
            'Europe/London',
            'Asia/Tbilisi',
            'America/Cayenne',
            'Africa/Accra',
            'Europe/Gibraltar',
            'America/Godthab',
            'America/Danmarkshavn',
            'America/Scoresbysund',
            'America/Thule',
            'Europe/Athens',
            'Atlantic/South_Georgia',
            'America/Guatemala',
            'Pacific/Guam',
            'Africa/Bissau',
            'America/Guyana',
            'Asia/Hong_Kong',
            'America/Tegucigalpa',
            'America/Port-au-Prince',
            'Europe/Budapest',
            'Asia/Jakarta',
            'Asia/Pontianak',
            'Asia/Makassar',
            'Asia/Jayapura',
            'Europe/Dublin',
            'Asia/Jerusalem',
            'Asia/Kolkata',
            'Indian/Chagos',
            'Asia/Baghdad',
            'Asia/Tehran',
            'Atlantic/Reykjavik',
            'Europe/Rome',
            'America/Jamaica',
            'Asia/Amman',
            'Asia/Tokyo',
            'Africa/Nairobi',
            'Asia/Bishkek',
            'Pacific/Tarawa',
            'Pacific/Enderbury',
            'Pacific/Kiritimati',
            'Asia/Pyongyang',
            'Asia/Seoul',
            'Asia/Almaty',
            'Asia/Qyzylorda',
            'Asia/Qostanay',
            'Asia/Aqtobe',
            'Asia/Aqtau',
            'Asia/Atyrau',
            'Asia/Oral',
            'Asia/Beirut',
            'Asia/Colombo',
            'Africa/Monrovia',
            'Europe/Vilnius',
            'Europe/Luxembourg',
            'Europe/Riga',
            'Africa/Tripoli',
            'Africa/Casablanca',
            'Europe/Monaco',
            'Europe/Chisinau',
            'Pacific/Majuro',
            'Pacific/Kwajalein',
            'Asia/Yangon',
            'Asia/Ulaanbaatar',
            'Asia/Hovd',
            'Asia/Choibalsan',
            'Asia/Macau',
            'America/Martinique',
            'Europe/Malta',
            'Indian/Mauritius',
            'Indian/Maldives',
            'America/Mexico_City',
            'America/Cancun',
            'America/Merida',
            'America/Monterrey',
            'America/Matamoros',
            'America/Mazatlan',
            'America/Chihuahua',
            'America/Ojinaga',
            'America/Hermosillo',
            'America/Tijuana',
            'America/Bahia_Banderas',
            'Asia/Kuala_Lumpur',
            'Asia/Kuching',
            'Africa/Maputo',
            'Africa/Windhoek',
            'Pacific/Noumea',
            'Pacific/Norfolk',
            'Africa/Lagos',
            'America/Managua',
            'Europe/Amsterdam',
            'Europe/Oslo',
            'Asia/Kathmandu',
            'Pacific/Nauru',
            'Pacific/Niue',
            'Pacific/Auckland',
            'Pacific/Chatham',
            'America/Panama',
            'America/Lima',
            'Pacific/Tahiti',
            'Pacific/Marquesas',
            'Pacific/Gambier',
            'Pacific/Port_Moresby',
            'Pacific/Bougainville',
            'Asia/Manila',
            'Asia/Karachi',
            'Europe/Warsaw',
            'America/Miquelon',
            'Pacific/Pitcairn',
            'America/Puerto_Rico',
            'Asia/Gaza',
            'Asia/Hebron',
            'Europe/Lisbon',
            'Atlantic/Madeira',
            'Atlantic/Azores',
            'Pacific/Palau',
            'America/Asuncion',
            'Asia/Qatar',
            'Indian/Reunion',
            'Europe/Bucharest',
            'Europe/Belgrade',
            'Europe/Kaliningrad',
            'Europe/Moscow',
            'Europe/Simferopol',
            'Europe/Kirov',
            'Europe/Astrakhan',
            'Europe/Volgograd',
            'Europe/Saratov',
            'Europe/Ulyanovsk',
            'Europe/Samara',
            'Asia/Yekaterinburg',
            'Asia/Omsk',
            'Asia/Novosibirsk',
            'Asia/Barnaul',
            'Asia/Tomsk',
            'Asia/Novokuznetsk',
            'Asia/Krasnoyarsk',
            'Asia/Irkutsk',
            'Asia/Chita',
            'Asia/Yakutsk',
            'Asia/Khandyga',
            'Asia/Vladivostok',
            'Asia/Ust-Nera',
            'Asia/Magadan',
            'Asia/Sakhalin',
            'Asia/Srednekolymsk',
            'Asia/Kamchatka',
            'Asia/Anadyr',
            'Asia/Riyadh',
            'Pacific/Guadalcanal',
            'Indian/Mahe',
            'Africa/Khartoum',
            'Europe/Stockholm',
            'Asia/Singapore',
            'America/Paramaribo',
            'Africa/Juba',
            'Africa/Sao_Tome',
            'America/El_Salvador',
            'Asia/Damascus',
            'America/Grand_Turk',
            'Africa/Ndjamena',
            'Indian/Kerguelen',
            'Asia/Bangkok',
            'Asia/Dushanbe',
            'Pacific/Fakaofo',
            'Asia/Dili',
            'Asia/Ashgabat',
            'Africa/Tunis',
            'Pacific/Tongatapu',
            'Europe/Istanbul',
            'America/Port_of_Spain',
            'Pacific/Funafuti',
            'Asia/Taipei',
            'Europe/Kiev',
            'Europe/Uzhgorod',
            'Europe/Zaporozhye',
            'Pacific/Wake',
            'America/New_York',
            'America/Detroit',
            'America/Kentucky/Louisville',
            'America/Kentucky/Monticello',
            'America/Indiana/Indianapolis',
            'America/Indiana/Vincennes',
            'America/Indiana/Winamac',
            'America/Indiana/Marengo',
            'America/Indiana/Petersburg',
            'America/Indiana/Vevay',
            'America/Chicago',
            'America/Indiana/Tell_City',
            'America/Indiana/Knox',
            'America/Menominee',
            'America/North_Dakota/Center',
            'America/North_Dakota/New_Salem',
            'America/North_Dakota/Beulah',
            'America/Denver',
            'America/Boise',
            'America/Phoenix',
            'America/Los_Angeles',
            'America/Anchorage',
            'America/Juneau',
            'America/Sitka',
            'America/Metlakatla',
            'America/Yakutat',
            'America/Nome',
            'America/Adak',
            'Pacific/Honolulu',
            'America/Montevideo',
            'Asia/Samarkand',
            'Asia/Tashkent',
            'America/Caracas',
            'Asia/Ho_Chi_Minh',
            'Pacific/Efate',
            'Pacific/Wallis',
            'Pacific/Apia',
            'Africa/Johannesburg'
        ]
    }
}