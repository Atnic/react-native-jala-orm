import BaseExpression from 'crane-query-builder/src/Expression'

class Expression extends BaseExpression {
  /**
   * Get the value of the expression.
   *
   * @return string
   */
  toString() {
    return this.getValue()
  }
}

export { Expression }
export default Expression
