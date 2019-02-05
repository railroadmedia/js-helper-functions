import { Content } from '../index';

describe('flattenContentObject', () => {
    it('takes an array of content with nested fields and data objects and returns them at the top level', () => {
        const testContent = [{
            name: 'test_1',
            fields: [{
                key: 'field_1',
                value: 'test',
            }],
            data: [{
                key: 'data_1',
                value: 'test',
            }]
        },
        {
            name: 'test_2',
            fields: [{
                key: 'field_1',
                value: 'test',
            }],
            data: [{
                key: 'data_1',
                value: 'test',
            }]
        }];
        const result = Content.flattenContent(testContent);

        // Expect first item
        expect(result[0]).toHaveProperty('name', 'test_1');
        expect(result[0]).toHaveProperty('field_1');
        expect(result[0]).toHaveProperty('data_1');

        // Expect second item
        expect(result[1]).toHaveProperty('name', 'test_2');
        expect(result[1]).toHaveProperty('field_1');
        expect(result[1]).toHaveProperty('data_1');
    });

    it('ignores duplicate keys and adds any to an array at the top level', () => {
        const testContent = [{
            name: 'test_1',
            fields: [{
                key: 'field_1',
                value: 'test',
            },{
                key: 'field_1',
                value: 'test',
            }],
            data: [{
                key: 'data_1',
                value: 'test',
            },{
                key: 'data_1',
                value: 'test',
            }]
        }];

        const result = Content.flattenContent(testContent);

        expect(result[0]).toHaveProperty('name', 'test_1');
        expect(result[0]).toHaveProperty('duplicates', ['field_1', 'data_1']);
    });
});


describe('topLevelContentTypes', () => {

    it('returns an array', () => {
        const types = Content.topLevelContentTypes();

        expect(Array.isArray(types)).toBe(true);
        expect(types.length).toBeGreaterThan(0)
    });
});


describe('getTypesWithChildrenByBrand', () => {

    it('returns types for drumeo', () => {
        const types = Content.getTypesWithChildrenByBrand('drumeo');

        expect(Array.isArray(types)).toBe(true);
        expect(types.length).toBeGreaterThan(0)
    });

    it('returns types for guitareo', () => {
        const types = Content.getTypesWithChildrenByBrand('guitareo');

        expect(Array.isArray(types)).toBe(true);
        expect(types.length).toBeGreaterThan(0)
    });

    it('returns types for pianote', () => {
        const types = Content.getTypesWithChildrenByBrand('pianote');

        expect(Array.isArray(types)).toBe(true);
        expect(types.length).toBeGreaterThan(0)
    });
});

describe('getParentContentType', () => {
    
    it('returns a child type for a valid parent type', () => {
        const type = Content.getParentContentType('course-part');

        expect(type).toBe('course');
    });

    it('returns undefined for an invalid parent type', () => {
        const type = Content.getParentContentType('invalid');

        expect(type).toBe(undefined);
    });
});

describe('getParentContentType', () => {

    it('returns a child type for a valid parent type', () => {
        const type = Content.getParentContentType('course-part');

        expect(type).toBe('course');
    });

    it('returns undefined for an invalid parent type', () => {
        const type = Content.getParentContentType('invalid');

        expect(type).toBe(undefined);
    });
});

describe('getBrandSpecificTopLevelContentTypes', () => {

    it('returns types for drumeo', () => {
        const types = Content.getBrandSpecificTopLevelContentTypes('drumeo');

        expect(Array.isArray(types)).toBe(true);
        expect(types.length).toBeGreaterThan(0)
    });

    it('returns types for guitareo', () => {
        const types = Content.getBrandSpecificTopLevelContentTypes('guitareo');

        expect(Array.isArray(types)).toBe(true);
        expect(types.length).toBeGreaterThan(0)
    });

    it('returns types for pianote', () => {
        const types = Content.getBrandSpecificTopLevelContentTypes('pianote');

        expect(Array.isArray(types)).toBe(true);
        expect(types.length).toBeGreaterThan(0)
    });
});

describe('getContentTypeIcon', () => {

    it('returns an icon class string for a valid type', () => {
        const icon = Content.getContentTypeIcon('course');

        expect(icon).toBe('icon-courses');
    });

    it('returns undefined for an invalid type', () => {
        const icon = Content.getContentTypeIcon('invalid');

        expect(icon).toBe(undefined);
    });
});

describe('shows', () => {
    it('returns an array', () => {
        const shows = Content.shows();

        expect(Array.isArray(shows)).toBe(true);
        expect(shows.length).toBeGreaterThan(0)
    });
});

