import { equal } from 'node:assert/strict';
import { describe, it } from 'node:test';

void describe('Sample test suite', () => {
    void it('will generate a report entry on failure', () => equal(2, 1, 'Expected 2 to equal 1'));
    void it('will not generate anything', () => equal(2, 2, 'Expected 2 to equal 2'));

    void describe('Nested test suite', () => {
        void it('will be skipped', (ctx) => ctx.skip('This test is skipped'));
        void it('todo test', (ctx) => ctx.todo('Implement me'));
    });
});

void it('top level test 1', () => equal(1, 1));
void it('top level test 2', () => equal(2, 2));
