import BaseExpression from 'crane-query-builder/src/Expression'

export default class Expression extends BaseExpression {
    constructor (value: string);

    getValue(): string;

    /**
     * Get the value of the expression.
     *
     * @return string
     */
    toString(): any;
}
