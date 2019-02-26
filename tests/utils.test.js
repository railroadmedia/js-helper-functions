import { Utils } from '../index';

describe('createObjectCopy', () => {
    it('creates a proper object copy and not a reference in memory', () => {
        const obj = {key: 'test', value: 'test'};
        const objCopy = Utils.createObjectCopy(obj);

        expect(obj).not.toBe(objCopy);
        expect(obj).toMatchObject(objCopy);
    });
});

describe('dynamicSort', () => {
    it('takes an array of objects and sorts them by the value of a specific key - with strings', () => {
        const array = [{ key: 'c' }, { key: 'a' }, { key: 'b' }];
        const sortedArray = Utils.dynamicSort(array, 'key');

        expect(sortedArray).toMatchObject([{ key: 'a' }, { key: 'b' }, { key: 'c' }])
    });

    it('takes an array of objects and sorts them by the value of a specific key - with numbers', () => {
        const array = [{ key: 3 }, { key: 1 }, { key: 2 }];
        const sortedArray = Utils.dynamicSort(array, 'key');

        expect(sortedArray).toMatchObject([{ key: 1 }, { key: 2 }, { key: 3 }])
    });
});

describe('isEmpty', () => {
    it('returns true with empty object', () => {
        const isEmpty = Utils.isEmpty({});

        expect(isEmpty).toBe(true)
    });

    it('returns false with object with properties', () => {
        const isEmpty = Utils.isEmpty({key: 'test'});

        expect(isEmpty).toBe(false)
    });
});

describe('toCapitalCase', () => {
    it('returns string with capitals at the beginning of every word', () => {
        const string = Utils.toCapitalCase('test string');

        expect(string).toBe('Test String');
    });
});

describe('range', () => {
    it('returns an array of numbers between the specified range', () => {
        const range = Utils.range(3, 1);

        expect(Array.isArray(range)).toBe(true);
        expect(range.length).toBe(3)
    });
});

describe('currencies', () => {
    it('returns an array of currencies', () => {
        const currencies = Utils.currencies();

        expect(Array.isArray(currencies)).toBe(true);
        expect(currencies.length).toBeGreaterThan(0)
    })
});

describe('countries', () => {
    it('returns an array of countries', () => {
        const countries = Utils.countries();

        expect(Array.isArray(countries)).toBe(true);
        expect(countries.length).toBeGreaterThan(0)
    })
});

describe('provinces', () => {
    it('returns an array of provinces', () => {
        const provinces = Utils.provinces();

        expect(Array.isArray(provinces)).toBe(true);
        expect(provinces.length).toBeGreaterThan(0)
    })
});

describe('triggerEvent', () => {

    it('triggers an event on a specified dom element', () => {
        document.body.innerHTML = '<div><button id="button"></div>';
        const button = document.getElementById('button');
        let clicked = false;

        button.addEventListener('click', () => {
            clicked = true;
        });

        Utils.triggerEvent(button, 'click');

        expect(clicked).toBe(true);
    });

});

describe('abbreviateNumberValue', () => {

    it('abbreviates a number value above 100 thousand and below 1 million as "100K"', () => {
        const number = Utils.abbreviateNumberValue(100000);

        expect(number).toBe('100K');
    });

    it('abbreviates any number above 1 million as "1M"', () => {
        const number = Utils.abbreviateNumberValue(1000000);

        expect(number).toBe('1.0M');
    });

    it('returns the input if its any other value', () => {
        const inputs = ['10', 10, null, undefined, {}, []];

        inputs.forEach(input => {
            const result = Utils.abbreviateNumberValue(input);

            expect(result).toBe(result);
        });
    });
});

describe('formatNumbersWithCommas', () => {

    it('returns a large number as a string with comma separators', () => {
        const thousand = Utils.formatNumbersWithCommas(1000);
        const tenThousand = Utils.formatNumbersWithCommas(10000);
        const hundredThousand = Utils.formatNumbersWithCommas(100000);
        const million = Utils.formatNumbersWithCommas(1000000);

        expect(thousand).toBe('1,000');
        expect(tenThousand).toBe('10,000');
        expect(hundredThousand).toBe('100,000');
        expect(million).toBe('1,000,000');
    });
});

describe('getScrollBarWidth', () => {

    it('returns 0 in a test environment', () => {
        const result = Utils.getScrollBarWidth();

        // Result in the test environment will always be 0
        expect(result).toBe(0);
    });
});