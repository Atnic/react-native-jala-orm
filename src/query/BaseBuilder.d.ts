export default class Builder {
    bindings: {
        select: any[];
        join: any[];
        where: any[];
        having: any[];
        order: any[];
        union: any[];
    };
    aggregate: {
        functionName: any;
        columns: any;
    };
    columns: any[];
    isDistinct: boolean;
    from: any;
    joins: any[];
    wheres: any[];
    groups: any;
    havings: any;
    orders: any;
    limit: any;
    offset: any;
    unions: any;
    unionLimit: any;
    unionOffset: any;
    unionOrders: any;
    lock: any;
    grammar: any;
    connection: any;

    /**
     * Create a raw database expression.
     *
     * @param value
     * @returns {*}
     */
    static raw(value: any): any;
    /**
     * Creates a subquery and parse it.
     *
     * @param query
     * @returns {[*, *]|[*, []]}
     */
    static createSub(query: any): [any, any] | [any, []];
    /**
     * Parse the subquery into SQL and bindings.
     *
     * @param query
     * @returns {*[]}
     */
    static parseSub(query: any): any[];
    static prepareValueAndOperator(value: any, operator: any, useDefault?: boolean): {
        checkedValue: any;
        checkedOperator: any;
    };
    /**
     * Determine if the given operator and value combination is legal.
     *
     * Prevents using Null values with invalid operators.
     *
     * @param operator
     * @param value
     * @returns {*|boolean}
     */
    static invalidOperatorAndValue(operator: any, value: any): any | boolean;
    /**
     * Determine if the given operator is supported.
     *
     * @param target
     * @returns {boolean}
     */
    static invalidOperator(target: any): boolean;
    /**
     * Create a new query instance for a sub-query.
     *
     * @returns {Builder}
     */
    static forSubQuery(): Builder;
    /**
     * Get a new instance of the query builder.
     *
     * @returns {Builder}
     */
    static newQuery(): Builder;
    /**
     *
     * @param value
     * @returns {*[]}
     */
    static wrap(value: any): any[];
    /**
     *
     * @param target
     * @param key
     * @returns {*|boolean}
     */
    static hasKey(target: any, key: any): any | boolean;
    /**
     * Set the table which the query is targeting.
     *
     * @param table
     * @param as
     * @returns {Builder}
     */
    table(table: any, as?: any): Builder;
    /**
     * Set the columns to be selected.
     *
     * @param columns
     * @returns {Builder}
     */
    select(columns?: string[], ...args: any[]): Builder;
    /**
     * Add a new "raw" select expression to the query.
     *
     * @param expression
     * @param bindings
     * @returns {Builder}
     */
    selectRaw(expression: any, bindings?: any[]): Builder;
    /**
     * Add a raw where clause to the query.
     *
     * @param sql
     * @param bindings
     * @param boolean
     * @return this
     */
    whereRaw(sql: any, bindings?: any[], boolean?: string): Builder;
    /**
     * Add a raw or where clause to the query.
     *
     * @param sql
     * @param bindings
     * @return this
     */
    orWhereRaw(sql: any, bindings?: any[]): Builder;
    /**
     * Add a new select column to the query.
     *
     * @param column
     * @returns {Builder}
     */
    addSelect(column: any, ...args: any[]): Builder;
    /**
     * Force the query to only return distinct results.
     *
     * @returns {Builder}
     */
    distinct(): Builder;
    /**
     * Add a basic where clause to the query.
     *
     * @param column
     * @param operator
     * @param value
     * @param boolean
     * @returns {Builder|*}
     */
    where(column: any, operator?: any, value?: any, boolean?: string, ...args: any[]): Builder | any;
    /**
     * Add an "or where" clause to the query.
     *
     * @param column
     * @param operator
     * @param value
     * @returns {Builder|*}
     */
    orWhere(column: any, operator?: any, value?: any, ...args: any[]): Builder | any;
    /**
     * Add a where between statement to the query.
     *
     * @param column
     * @param values
     * @param boolean
     * @param not
     * @returns {Builder}
     */
    whereBetween(column: any, values: any, boolean?: string, not?: boolean): Builder;
    /**
     * Add an or where between statement to the query.
     *
     * @param column
     * @param values
     * @returns {Builder}
     */
    orWhereBetween(column: any, values: any): Builder;
    /**
     * Add a where not between statement to the query.
     *
     * @param column
     * @param values
     * @param boolean
     * @returns {Builder}
     */
    whereNotBetween(column: any, values: any, boolean?: string): Builder;
    /**
     * Add an or where not between statement to the query.
     *
     * @param column
     * @param values
     * @returns {Builder}
     */
    orWhereNotBetween(column: any, values: any): Builder;
    /**
     * Add a "where null" clause to the query.
     *
     * @param columns
     * @param boolean
     * @param not
     * @returns {Builder}
     */
    whereNull(columns: any, boolean?: string, not?: boolean): Builder;
    /**
     * Add an "or where null" clause to the query.
     *
     * @param column
     * @returns {Builder}
     */
    orWhereNull(column: any): Builder;
    /**
     * Add a "where not null" clause to the query.
     *
     * @param column
     * @param boolean
     * @returns {Builder}
     */
    whereNotNull(column: any, boolean?: string): Builder;
    /**
     * Add an "or where not null" clause to the query.
     *
     * @param column
     * @returns {Builder}
     */
    orWhereNotNull(column: any): Builder;
    /**
     * Add a "where in" clause to the query.
     *
     * @param column
     * @param values
     * @param boolean
     * @param not
     * @returns {Builder}
     */
    whereIn(column: any, values: any, boolean?: string, not?: boolean): Builder;
    /**
     * Add an "or where in" clause to the query.
     *
     * @param column
     * @param values
     * @returns {Builder}
     */
    orWhereIn(column: any, values: any): Builder;
    /**
     * Add a "where not in" clause to the query.
     *
     * @param column
     * @param values
     * @param boolean
     * @returns {Builder}
     */
    whereNotIn(column: any, values: any, boolean?: string): Builder;
    /**
     * Add an "or where not in" clause to the query.
     *
     * @param column
     * @param values
     * @returns {Builder}
     */
    orWhereNotIn(column: any, values: any): Builder;
    /**
     * Add a "where date" statement to the query.
     *
     * @param column
     * @param operator
     * @param value
     * @param boolean
     * @returns {*}
     */
    whereDate(column: any, operator: any, value?: any, boolean?: string, ...args: any[]): any;
    /**
     * Add an "or where date" statement to the query.
     *
     * @param column
     * @param operator
     * @param value
     * @returns {*}
     */
    orWhereDate(column: any, operator: any, value?: any, ...args: any[]): any;
    /**
     * Add a "where time" statement to the query.
     *
     * @param column
     * @param operator
     * @param value
     * @param boolean
     * @returns {*}
     */
    whereTime(column: any, operator: any, value?: any, boolean?: string, ...args: any[]): any;
    /**
     * Add an "or where time" statement to the query.
     *
     * @param column
     * @param operator
     * @param value
     * @returns {*}
     */
    orWhereTime(column: any, operator: any, value?: any, ...args: any[]): any;
    /**
     * Add a "where day" statement to the query.
     *
     * @param column
     * @param operator
     * @param value
     * @param boolean
     * @returns {*}
     */
    whereDay(column: any, operator: any, value?: any, boolean?: string, ...args: any[]): any;
    /**
     * Add an "or where day" statement to the query.
     *
     * @param column
     * @param operator
     * @param value
     * @returns {*}
     */
    orWhereDay(column: any, operator: any, value?: any, ...args: any[]): any;
    /**
     * Add a "where month" statement to the query.
     *
     * @param column
     * @param operator
     * @param value
     * @param boolean
     * @returns {*}
     */
    whereMonth(column: any, operator: any, value?: any, boolean?: string, ...args: any[]): any;
    /**
     * Add an "or where month" statement to the query.
     *
     * @param column
     * @param operator
     * @param value
     * @returns {*}
     */
    orWhereMonth(column: any, operator: any, value?: any, ...args: any[]): any;
    /**
     * Add a "where year" statement to the query.
     *
     * @param column
     * @param operator
     * @param value
     * @param boolean
     * @returns {*}
     */
    whereYear(column: any, operator: any, value?: any, boolean?: string, ...args: any[]): any;
    /**
     * Add an "or where year" statement to the query.
     *
     * @param column
     * @param operator
     * @param value
     * @returns {*}
     */
    orWhereYear(column: any, operator: any, value?: any, ...args: any[]): any;
    /**
     * Add a date based (year, month, day, time) statement to the query.
     *
     * @param type
     * @param column
     * @param operator
     * @param value
     * @param boolean
     * @returns {Builder}
     */
    addDateBasedWhere(type: any, column: any, operator: any, value: any, boolean?: string): Builder;
    /**
     * Add a "where" clause comparing two columns to the query.
     *
     * @param first
     * @param operator
     * @param second
     * @param boolean
     * @returns {Builder|*}
     */
    whereColumn(first: any, operator?: any, second?: any, boolean?: string): Builder | any;
    /**
     * Add an "or where" clause comparing two columns to the query.
     *
     * @param first
     * @param operator
     * @param second
     * @returns {Builder|*}
     */
    orWhereColumn(first: any, operator?: any, second?: any): Builder | any;
    /**
     * Add a "group by" clause to the query.
     *
     * @param groups
     * @returns {Builder}
     */
    groupBy(...groups: any[]): Builder;
    /**
     * Add a "having" clause to the query.
     *
     * @param column
     * @param operator
     * @param value
     * @param boolean
     * @returns {Builder}
     */
    having(column: any, operator?: any, value?: any, boolean?: string, ...args: any[]): Builder;
    /**
     * Add a "or having" clause to the query.
     *
     * @param column
     * @param operator
     * @param value
     * @returns {Builder}
     */
    orHaving(column: any, operator?: any, value?: any, ...args: any[]): Builder;
    /**
     * Add a "having between " clause to the query.
     *
     * @param column
     * @param values
     * @param boolean
     * @param not
     * @returns {Builder}
     */
    havingBetween(column: any, values: any, boolean?: string, not?: boolean): Builder;
    /**
     * Add a raw having clause to the query.
     *
     * @param sql
     * @param bindings
     * @param boolean
     * @returns {Builder}
     */
    havingRaw(sql: any, bindings?: any[], boolean?: string): Builder;
    /**
     * Add a raw or having clause to the query.
     *
     * @param sql
     * @param bindings
     * @returns {Builder}
     */
    orHavingRaw(sql: any, bindings?: any[]): Builder;
    /**
     * Add an "order by" clause to the query.
     *
     * @param column
     * @param direction
     * @returns {Builder}
     */
    orderBy(column: any, direction?: string): Builder;
    /**
     * Add a descending "order by" clause to the query.
     *
     * @param column
     * @returns {Builder}
     */
    orderByDesc(column: any): Builder;
    /**
     * Add an "order by" clause for a timestamp to the query.
     *
     * @param column
     * @returns {Builder}
     */
    latest(column?: string): Builder;
    /**
     * Add an "order by" clause for a timestamp to the query.
     *
     * @param column
     * @returns {Builder}
     */
    oldest(column?: string): Builder;
    /**
     * Put the query's results in random order.
     *
     * @param seed
     * @returns {*}
     */
    inRandomOrder(seed?: string): any;
    /**
     * Add a raw "order by" clause to the query.
     *
     * @param sql
     * @param bindings
     * @returns {Builder}
     */
    orderByRaw(sql: any, bindings?: any[]): Builder;
    /**
     * Alias to set the "offset" value of the query.
     *
     * @param value
     * @returns {Builder}
     */
    skip(value: any): Builder;
    /**
     * Alias to set the "limit" value of the query.
     *
     * @param value
     * @returns {Builder}
     */
    take(value: any): Builder;
    /**
     * Set the limit and offset for a given page.
     *
     * @param page
     * @param perPage
     * @returns {Builder}
     */
    forPage(page: any, perPage?: number): Builder;
    /**
     * Add a join clause to the query.
     *
     * @param  table
     * @param  first
     * @param  operator
     * @param  second
     * @param  type
     * @param  where
     * @return {Builder}
     */
    join(table: any, first: any, operator?: any, second?: any, type?: string, where?: boolean): Builder;
    /**
     * Add a "join where" clause to the query.
     *
     * @param  table
     * @param  first
     * @param  operator
     * @param  second
     * @param  type
     * @return {Builder}
     */
    joinWhere(table: any, first: any, operator: any, second: any, type?: string): Builder;
    /**
     * Add a subquery join clause to the query.
     *
     * @param  query
     * @param  as
     * @param  first
     * @param  operator
     * @param  second
     * @param  type
     * @param  where
     * @return {Builder}
     */
    joinSub(query: any, as: any, first: any, operator?: any, second?: any, type?: string, where?: boolean): Builder;
    /**
     * Add a left join to the query.
     *
     * @param  table
     * @param  first
     * @param  operator
     * @param  second
     * @return {Builder}
     */
    leftJoin(table: any, first: any, operator?: any, second?: any): Builder;
    /**
     * Add a "join where" clause to the query.
     *
     * @param  table
     * @param  first
     * @param  operator
     * @param  second
     * @return {Builder}
     */
    leftJoinWhere(table: any, first: any, operator: any, second: any): Builder;
    /**
     * Add a subquery left join to the query.
     *
     * @param  query
     * @param  as
     * @param  first
     * @param  operator
     * @param  second
     * @return {Builder}
     */
    leftJoinSub(query: any, as: any, first: any, operator?: any, second?: any): Builder;
    /**
     * Add a right join to the query.
     *
     * @param  table
     * @param  first
     * @param  operator
     * @param  second
     * @return {Builder}
     */
    rightJoin(table: any, first: any, operator?: any, second?: any): Builder;
    /**
     * Add a "right join where" clause to the query.
     *
     * @param  table
     * @param  first
     * @param  operator
     * @param  second
     * @return {Builder}
     */
    rightJoinWhere(table: any, first: any, operator: any, second: any): Builder;
    /**
     * Add a subquery right join to the query.
     *
     * @param  query
     * @param  as
     * @param  first
     * @param  operator
     * @param  second
     * @return {Builder}
     */
    rightJoinSub(query: any, as: any, first: any, operator?: any, second?: any): Builder;
    /**
     * Add a "cross join" clause to the query.
     *
     * @param  table
     * @param  first
     * @param  operator
     * @param  second
     * @return {Builder}
     */
    crossJoin(table: any, first?: any, operator?: any, second?: any): Builder;
    /**
     * Get a new join clause.
     *
     * @param  parentQuery
     * @param  type
     * @param  table
     * @return {Builder}
     */
    newJoinClause(parentQuery: any, type: any, table: any): Builder;
    /**
     *
     * @param parentQuery
     * @param type
     * @param table
     */
    createJoinClause(parentQuery: any, type: any, table: any): Builder;
    /**
     *
     * @param first
     * @param operator
     * @param second
     * @param boolean
     * @returns {Builder|*}
     */
    on(first: any, operator?: any, second?: any, boolean?: string): Builder | any;
    /**
     *
     * @param first
     * @param operator
     * @param second
     * @returns {Builder|*}
     */
    orOn(first: any, operator?: any, second?: any): Builder | any;
    /**
     *
     * @returns {Builder}
     */
    newQuery(): Builder;
    /**
     *
     * @returns {Builder}
     */
    forSubQuery(): Builder;
    /**
     *
     * @returns {*}
     */
    newParentQuery(): any;
    /**
     * Add a union statement to the query.
     *
     * @param query
     * @param all
     * @returns {Builder}
     */
    union(query: any, all?: boolean): Builder;
    /**
     * Add a union all statement to the query.
     *
     * @param query
     * @returns {Builder}
     */
    unionAll(query: any): Builder;
    /**
     * Determine if any rows exist for the current query.
     *
     * @return boolean
     */
    exists(): Promise<boolean>;
    /**
     * Determine if no rows exist for the current query.
     *
     * @return boolean
     */
    doesntExist(): Promise<boolean>;
    /**
     * Execute the given callback if no rows exist for the current query.
     *
     * @param  callback
     * @return mixed
     */
    existsOr(callback: any): Promise<any>;
    /**
     * Execute the given callback if rows exist for the current query.
     *
     * @param callback
     * @return mixed
     */
    doesntExistOr(callback: any): Promise<any>;
    /**
     * Retrieve the "count" result of the query.
     *
     * @param columns
     * @return mixed
     */
    count(columns?: string): Promise<any>;
    /**
     * Retrieve the minimum value of a given column.
     *
     * @param column
     * @return mixed
     */
    min(column: any): Promise<any>;
    /**
     * Retrieve the maximum value of a given column.
     *
     * @param column
     * @return mixed
     */
    max(column: any): Promise<any>;
    /**
     * Retrieve the sum of the values of a given column.
     *
     * @param column
     * @return mixed
     */
    sum(column: any): Promise<any>;
    /**
     * Retrieve the average of the values of a given column.
     *
     * @param column
     * @return mixed
     */
    avg(column: any): Promise<any>;
    /**
     * Alias for the "avg" method.
     *
     * @param column
     * @return mixed
     */
    average(column: any): Promise<any>;
    /**
     * Execute an aggregate function on the database.
     *
     * @param functionName
     * @param columns
     * @return mixed
     */
    startAggregate(functionName: any, columns?: string[]): Promise<any>;
    /**
     * Set the aggregate property without running the query.
     *
     * @param functionName
     * @param columns
     * @return this
     */
    setAggregate(functionName: any, columns: any): Builder;
    /**
     * Clone the query without the given properties.
     *
     * @param properties
     * @return static
     */
    cloneWithout(properties: any): any;
    /**
     * Clone the query without the given bindings.
     *
     * @param except
     * @return static
     */
    cloneWithoutBindings(except: any): any;
    /**
     * Remove all of the expressions from a list of bindings.
     *
     * @param bindings
     * @returns {*}
     */
    cleanBindings(bindings: any): any;
    /**
     * Add a subselect expression to the query.
     *
     * @param query
     * @param as
     * @returns {Builder}
     */
    selectSub(query: any, as: any): Builder;
    /**
     * Add a full sub-select to the query.
     *
     * @param column
     * @param operator
     * @param callback
     * @param boolean
     * @returns {Builder}
     */
    whereSub(column: any, operator: any, callback: any, boolean: any): Builder;
    /**
     * Add a binding to the query.
     *
     * @param value
     * @param type
     * @returns {Builder}
     */
    addBinding(value: any, type?: string): Builder;
    /**
     * Get the current query value bindings in a flattened array.
     *
     * @returns {Tree | * | any[]}
     */
    getBindings(): any | any[];
    /**
     * Add an array of where clauses to the query.
     *
     * @param column
     * @param boolean
     * @param method
     * @returns {*}
     */
    addArrayOfWheres(column: any, boolean: any, method?: string): any;
    /**
     * Add a nested where statement to the query.
     *
     * @param callback
     * @param boolean
     * @returns {*}
     */
    whereNested(callback: any, boolean?: string): any;
    /**
     * Create a new query instance for nested where condition.
     *
     * @returns {Builder}
     */
    forNestedWhere(): Builder;
    /**
     * Add another query builder as a nested where to the query builder.
     *
     * @param query
     * @param boolean
     * @returns {Builder}
     */
    addNestedWhereQuery(query: any, boolean?: string): Builder;
    /**
     * Get the raw array of bindings.
     *
     * @returns {{select: [], having: [], where: [], join: [], union: [], order: []}|*}
     */
    getRawBindings(): {
        select: [];
        having: [];
        where: [];
        join: [];
        union: [];
        order: [];
    } | any;
    /**
     *
     * @returns {string}
     */
    toSql(): string;
    /**
     *
     * @returns {{params: *, sql: *}}
     */
    collect(): {
        params: any;
        sql: any;
    };
    /**
     *
     * @returns {*}
     */
    get(): any;
    /**
     *
     * @returns {*}
     */
    first(columns?: string[]): any;
    /**
     * Insert a new record into the database.
     *
     * @param values
     * @return boolean
     */
    insert(values: any): any;
    /**
     * Insert a new record into the database while ignoring errors.
     *
     * @param values
     * @return int
     */
    insertOrIgnore(values: any): any;
    /**
     * Insert a new record and get the value of the primary key.
     *
     * @param values
     * @param sequence
     * @return int
     */
    insertGetId(values: any, sequence?: any): any;
    /**
     * Insert new records into the table using a subquery.
     *
     * @param  columns
     * @param  query
     * @return int
     */
    insertUsing(columns: any, query: any): any;
    /**
     * Update a record in the database.
     *
     * @param  values
     * @return int
     */
    update(values: any): any;
    /**
     * Insert or update a record matching the attributes, and fill it with values.
     *
     * @param  attributes
     * @param  values
     * @return boolean
     */
    updateOrInsert(attributes: any, values?: {}): Promise<any>;
    /**
     * Increment a column's value by a given amount.
     *
     * @param  column
     * @param  amount
     * @param  extra
     * @return int
     *
     * @throws \InvalidArgumentException
     */
    increment(column: any, amount?: number, extra?: {}): any;
    /**
     * Decrement a column's value by a given amount.
     *
     * @param  column
     * @param  amount
     * @param  extra
     * @return int
     *
     * @throws \InvalidArgumentException
     */
    decrement(column: any, amount?: number, extra?: {}): any;
    /**
     * Delete a record from the database.
     *
     * @param id
     * @return int
     */
    delete(id?: any): any;
    /**
     * Run a truncate statement on the table.
     *
     * @return Promise
     */
    truncate(): any;
    /**
     * Execute a query for a single record by ID.
     *
     * @param id
     * @param columns
     * @return mixed|static
     */
    find(id: any, columns?: string[]): any;
    /**
     * Get a single column's value from the first result of a query.
     *
     * @param column
     * @return mixed
     */
    value(column: any): Promise<any>;
    /**
     * Execute the given callback while selecting the given columns.
     *
     * After running the callback, the columns are reset to the original value.
     *
     * @param columns
     * @param callback
     * @return mixed
     */
    onceWithColumns(columns: any, callback: any): Promise<any>;
    /**
     * Get an array with the values of a given column.
     *
     * @param column
     * @param key
     * @return any
     */
    pluck(column: any, key?: any): Promise<any>;
    /**
     * Strip off the table name or alias from a column identifier.
     *
     * @param column
     * @return string|null
     */
    stripTableForPluck(column: any): any;
    /**
     * Retrieve column values from rows represented as objects.
     *
     * @param queryResult
     * @param column
     * @param key
     * @return any
     */
    pluckFromObjectColumn(queryResult: any, column: any, key: any): any[];
}
