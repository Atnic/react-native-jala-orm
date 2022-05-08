import Builder from "./Builder";
import Model from "./Model";

export default class Scope {
    /**
     * Apply the scope to a given Eloquent query builder.
     *
     * @param  {Builder}  builder
     * @param  {Model}  model
     * @return void
     */
    apply(builder: Builder, model: Model): void;
}
