'use strict';var core_1 = require('angular2/core');
var constants_1 = require('./constants');
var INITIAL_VALUE = {
    __UNINITIALIZED__: true
};
var DowngradeNg2ComponentAdapter = (function () {
    function DowngradeNg2ComponentAdapter(id, info, element, attrs, scope, parentInjector, parse, viewManager, protoView) {
        this.id = id;
        this.info = info;
        this.element = element;
        this.attrs = attrs;
        this.scope = scope;
        this.parentInjector = parentInjector;
        this.parse = parse;
        this.viewManager = viewManager;
        this.protoView = protoView;
        this.component = null;
        this.inputChangeCount = 0;
        this.inputChanges = null;
        this.hostViewRef = null;
        this.changeDetector = null;
        this.contentInserctionPoint = null;
        this.element[0].id = id;
        this.componentScope = scope.$new();
        this.childNodes = element.contents();
    }
    DowngradeNg2ComponentAdapter.prototype.bootstrapNg2 = function () {
        var childInjector = this.parentInjector.resolveAndCreateChild([core_1.provide(constants_1.NG1_SCOPE, { useValue: this.componentScope })]);
        this.hostViewRef =
            this.viewManager.createRootHostView(this.protoView, '#' + this.id, childInjector);
        var renderer = this.hostViewRef.render;
        var hostElement = this.viewManager.getHostElement(this.hostViewRef);
        this.changeDetector = this.hostViewRef.changeDetectorRef;
        this.component = this.viewManager.getComponent(hostElement);
        this.contentInserctionPoint = renderer.rootContentInsertionPoints[0];
    };
    DowngradeNg2ComponentAdapter.prototype.setupInputs = function () {
        var _this = this;
        var attrs = this.attrs;
        var inputs = this.info.inputs;
        for (var i = 0; i < inputs.length; i++) {
            var input = inputs[i];
            var expr = null;
            if (attrs.hasOwnProperty(input.attr)) {
                var observeFn = (function (prop) {
                    var prevValue = INITIAL_VALUE;
                    return function (value) {
                        if (_this.inputChanges !== null) {
                            _this.inputChangeCount++;
                            _this.inputChanges[prop] =
                                new Ng1Change(value, prevValue === INITIAL_VALUE ? value : prevValue);
                            prevValue = value;
                        }
                        _this.component[prop] = value;
                    };
                })(input.prop);
                attrs.$observe(input.attr, observeFn);
            }
            else if (attrs.hasOwnProperty(input.bindAttr)) {
                expr = attrs[input.bindAttr];
            }
            else if (attrs.hasOwnProperty(input.bracketAttr)) {
                expr = attrs[input.bracketAttr];
            }
            else if (attrs.hasOwnProperty(input.bindonAttr)) {
                expr = attrs[input.bindonAttr];
            }
            else if (attrs.hasOwnProperty(input.bracketParenAttr)) {
                expr = attrs[input.bracketParenAttr];
            }
            if (expr != null) {
                var watchFn = (function (prop) { return function (value, prevValue) {
                    if (_this.inputChanges != null) {
                        _this.inputChangeCount++;
                        _this.inputChanges[prop] = new Ng1Change(prevValue, value);
                    }
                    _this.component[prop] = value;
                }; })(input.prop);
                this.componentScope.$watch(expr, watchFn);
            }
        }
        var prototype = this.info.type.prototype;
        if (prototype && prototype.ngOnChanges) {
            // Detect: OnChanges interface
            this.inputChanges = {};
            this.componentScope.$watch(function () { return _this.inputChangeCount; }, function () {
                var inputChanges = _this.inputChanges;
                _this.inputChanges = {};
                _this.component.ngOnChanges(inputChanges);
            });
        }
        this.componentScope.$watch(function () { return _this.changeDetector && _this.changeDetector.detectChanges(); });
    };
    DowngradeNg2ComponentAdapter.prototype.projectContent = function () {
        var childNodes = this.childNodes;
        if (this.contentInserctionPoint) {
            var parent = this.contentInserctionPoint.parentNode;
            for (var i = 0, ii = childNodes.length; i < ii; i++) {
                parent.insertBefore(childNodes[i], this.contentInserctionPoint);
            }
        }
    };
    DowngradeNg2ComponentAdapter.prototype.setupOutputs = function () {
        var _this = this;
        var attrs = this.attrs;
        var outputs = this.info.outputs;
        for (var j = 0; j < outputs.length; j++) {
            var output = outputs[j];
            var expr = null;
            var assignExpr = false;
            var bindonAttr = output.bindonAttr ? output.bindonAttr.substring(0, output.bindonAttr.length - 6) : null;
            var bracketParenAttr = output.bracketParenAttr ?
                "[(" + output.bracketParenAttr.substring(2, output.bracketParenAttr.length - 8) + ")]" :
                null;
            if (attrs.hasOwnProperty(output.onAttr)) {
                expr = attrs[output.onAttr];
            }
            else if (attrs.hasOwnProperty(output.parenAttr)) {
                expr = attrs[output.parenAttr];
            }
            else if (attrs.hasOwnProperty(bindonAttr)) {
                expr = attrs[bindonAttr];
                assignExpr = true;
            }
            else if (attrs.hasOwnProperty(bracketParenAttr)) {
                expr = attrs[bracketParenAttr];
                assignExpr = true;
            }
            if (expr != null && assignExpr != null) {
                var getter = this.parse(expr);
                var setter = getter.assign;
                if (assignExpr && !setter) {
                    throw new Error("Expression '" + expr + "' is not assignable!");
                }
                var emitter = this.component[output.prop];
                if (emitter) {
                    emitter.subscribe({
                        next: assignExpr ? (function (setter) { return function (value) { return setter(_this.scope, value); }; })(setter) :
                            (function (getter) { return function (value) { return getter(_this.scope, { $event: value }); }; })(getter)
                    });
                }
                else {
                    throw new Error("Missing emitter '" + output.prop + "' on component '" + this.info.selector + "'!");
                }
            }
        }
    };
    DowngradeNg2ComponentAdapter.prototype.registerCleanup = function () {
        var _this = this;
        this.element.bind('$remove', function () { return _this.viewManager.destroyRootHostView(_this.hostViewRef); });
    };
    return DowngradeNg2ComponentAdapter;
})();
exports.DowngradeNg2ComponentAdapter = DowngradeNg2ComponentAdapter;
var Ng1Change = (function () {
    function Ng1Change(previousValue, currentValue) {
        this.previousValue = previousValue;
        this.currentValue = currentValue;
    }
    Ng1Change.prototype.isFirstChange = function () { return this.previousValue === this.currentValue; };
    return Ng1Change;
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG93bmdyYWRlX25nMl9hZGFwdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYW5ndWxhcjIvc3JjL3VwZ3JhZGUvZG93bmdyYWRlX25nMl9hZGFwdGVyLnRzIl0sIm5hbWVzIjpbIkRvd25ncmFkZU5nMkNvbXBvbmVudEFkYXB0ZXIiLCJEb3duZ3JhZGVOZzJDb21wb25lbnRBZGFwdGVyLmNvbnN0cnVjdG9yIiwiRG93bmdyYWRlTmcyQ29tcG9uZW50QWRhcHRlci5ib290c3RyYXBOZzIiLCJEb3duZ3JhZGVOZzJDb21wb25lbnRBZGFwdGVyLnNldHVwSW5wdXRzIiwiRG93bmdyYWRlTmcyQ29tcG9uZW50QWRhcHRlci5wcm9qZWN0Q29udGVudCIsIkRvd25ncmFkZU5nMkNvbXBvbmVudEFkYXB0ZXIuc2V0dXBPdXRwdXRzIiwiRG93bmdyYWRlTmcyQ29tcG9uZW50QWRhcHRlci5yZWdpc3RlckNsZWFudXAiLCJOZzFDaGFuZ2UiLCJOZzFDaGFuZ2UuY29uc3RydWN0b3IiLCJOZzFDaGFuZ2UuaXNGaXJzdENoYW5nZSJdLCJtYXBwaW5ncyI6IkFBQUEscUJBU08sZUFBZSxDQUFDLENBQUE7QUFDdkIsMEJBQXdCLGFBQWEsQ0FBQyxDQUFBO0FBS3RDLElBQU0sYUFBYSxHQUFHO0lBQ3BCLGlCQUFpQixFQUFFLElBQUk7Q0FDeEIsQ0FBQztBQUVGO0lBVUVBLHNDQUFvQkEsRUFBVUEsRUFBVUEsSUFBbUJBLEVBQ3ZDQSxPQUFpQ0EsRUFBVUEsS0FBMEJBLEVBQ3JFQSxLQUFxQkEsRUFBVUEsY0FBd0JBLEVBQ3ZEQSxLQUE0QkEsRUFBVUEsV0FBMkJBLEVBQ2pFQSxTQUF1QkE7UUFKdkJDLE9BQUVBLEdBQUZBLEVBQUVBLENBQVFBO1FBQVVBLFNBQUlBLEdBQUpBLElBQUlBLENBQWVBO1FBQ3ZDQSxZQUFPQSxHQUFQQSxPQUFPQSxDQUEwQkE7UUFBVUEsVUFBS0EsR0FBTEEsS0FBS0EsQ0FBcUJBO1FBQ3JFQSxVQUFLQSxHQUFMQSxLQUFLQSxDQUFnQkE7UUFBVUEsbUJBQWNBLEdBQWRBLGNBQWNBLENBQVVBO1FBQ3ZEQSxVQUFLQSxHQUFMQSxLQUFLQSxDQUF1QkE7UUFBVUEsZ0JBQVdBLEdBQVhBLFdBQVdBLENBQWdCQTtRQUNqRUEsY0FBU0EsR0FBVEEsU0FBU0EsQ0FBY0E7UUFiM0NBLGNBQVNBLEdBQVFBLElBQUlBLENBQUNBO1FBQ3RCQSxxQkFBZ0JBLEdBQVdBLENBQUNBLENBQUNBO1FBQzdCQSxpQkFBWUEsR0FBa0NBLElBQUlBLENBQUNBO1FBQ25EQSxnQkFBV0EsR0FBZ0JBLElBQUlBLENBQUNBO1FBQ2hDQSxtQkFBY0EsR0FBc0JBLElBQUlBLENBQUNBO1FBR3pDQSwyQkFBc0JBLEdBQVNBLElBQUlBLENBQUNBO1FBTzVCQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQSxDQUFFQSxDQUFDQSxFQUFFQSxHQUFHQSxFQUFFQSxDQUFDQTtRQUMvQkEsSUFBSUEsQ0FBQ0EsY0FBY0EsR0FBR0EsS0FBS0EsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0E7UUFDbkNBLElBQUlBLENBQUNBLFVBQVVBLEdBQWdCQSxPQUFPQSxDQUFDQSxRQUFRQSxFQUFFQSxDQUFDQTtJQUNwREEsQ0FBQ0E7SUFFREQsbURBQVlBLEdBQVpBO1FBQ0VFLElBQUlBLGFBQWFBLEdBQUdBLElBQUlBLENBQUNBLGNBQWNBLENBQUNBLHFCQUFxQkEsQ0FDekRBLENBQUNBLGNBQU9BLENBQUNBLHFCQUFTQSxFQUFFQSxFQUFDQSxRQUFRQSxFQUFFQSxJQUFJQSxDQUFDQSxjQUFjQSxFQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtRQUMzREEsSUFBSUEsQ0FBQ0EsV0FBV0E7WUFDWkEsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0Esa0JBQWtCQSxDQUFDQSxJQUFJQSxDQUFDQSxTQUFTQSxFQUFFQSxHQUFHQSxHQUFHQSxJQUFJQSxDQUFDQSxFQUFFQSxFQUFFQSxhQUFhQSxDQUFDQSxDQUFDQTtRQUN0RkEsSUFBSUEsUUFBUUEsR0FBY0EsSUFBSUEsQ0FBQ0EsV0FBWUEsQ0FBQ0EsTUFBTUEsQ0FBQ0E7UUFDbkRBLElBQUlBLFdBQVdBLEdBQUdBLElBQUlBLENBQUNBLFdBQVdBLENBQUNBLGNBQWNBLENBQUNBLElBQUlBLENBQUNBLFdBQVdBLENBQUNBLENBQUNBO1FBQ3BFQSxJQUFJQSxDQUFDQSxjQUFjQSxHQUFHQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxpQkFBaUJBLENBQUNBO1FBQ3pEQSxJQUFJQSxDQUFDQSxTQUFTQSxHQUFHQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxZQUFZQSxDQUFDQSxXQUFXQSxDQUFDQSxDQUFDQTtRQUM1REEsSUFBSUEsQ0FBQ0Esc0JBQXNCQSxHQUFHQSxRQUFRQSxDQUFDQSwwQkFBMEJBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO0lBQ3ZFQSxDQUFDQTtJQUVERixrREFBV0EsR0FBWEE7UUFBQUcsaUJBb0RDQTtRQW5EQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0E7UUFDdkJBLElBQUlBLE1BQU1BLEdBQUdBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBO1FBQzlCQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxFQUFFQSxDQUFDQSxHQUFHQSxNQUFNQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQSxFQUFFQSxFQUFFQSxDQUFDQTtZQUN2Q0EsSUFBSUEsS0FBS0EsR0FBR0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDdEJBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBO1lBQ2hCQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxjQUFjQSxDQUFDQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDckNBLElBQUlBLFNBQVNBLEdBQUdBLENBQUNBLFVBQUNBLElBQUlBO29CQUNwQkEsSUFBSUEsU0FBU0EsR0FBR0EsYUFBYUEsQ0FBQ0E7b0JBQzlCQSxNQUFNQSxDQUFDQSxVQUFDQSxLQUFLQTt3QkFDWEEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBSUEsQ0FBQ0EsWUFBWUEsS0FBS0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7NEJBQy9CQSxLQUFJQSxDQUFDQSxnQkFBZ0JBLEVBQUVBLENBQUNBOzRCQUN4QkEsS0FBSUEsQ0FBQ0EsWUFBWUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7Z0NBQ25CQSxJQUFJQSxTQUFTQSxDQUFDQSxLQUFLQSxFQUFFQSxTQUFTQSxLQUFLQSxhQUFhQSxHQUFHQSxLQUFLQSxHQUFHQSxTQUFTQSxDQUFDQSxDQUFDQTs0QkFDMUVBLFNBQVNBLEdBQUdBLEtBQUtBLENBQUNBO3dCQUNwQkEsQ0FBQ0E7d0JBQ0RBLEtBQUlBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLEdBQUdBLEtBQUtBLENBQUNBO29CQUMvQkEsQ0FBQ0EsQ0FBQ0E7Z0JBQ0pBLENBQUNBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO2dCQUNmQSxLQUFLQSxDQUFDQSxRQUFRQSxDQUFDQSxLQUFLQSxDQUFDQSxJQUFJQSxFQUFFQSxTQUFTQSxDQUFDQSxDQUFDQTtZQUN4Q0EsQ0FBQ0E7WUFBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsY0FBY0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ2hEQSxJQUFJQSxHQUFHQSxLQUFLQSxDQUFDQSxLQUFLQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQTtZQUMvQkEsQ0FBQ0E7WUFBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsY0FBY0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ25EQSxJQUFJQSxHQUFHQSxLQUFLQSxDQUFDQSxLQUFLQSxDQUFDQSxXQUFXQSxDQUFDQSxDQUFDQTtZQUNsQ0EsQ0FBQ0E7WUFBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsY0FBY0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ2xEQSxJQUFJQSxHQUFHQSxLQUFLQSxDQUFDQSxLQUFLQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQTtZQUNqQ0EsQ0FBQ0E7WUFBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsY0FBY0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsZ0JBQWdCQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDeERBLElBQUlBLEdBQUdBLEtBQUtBLENBQUNBLEtBQUtBLENBQUNBLGdCQUFnQkEsQ0FBQ0EsQ0FBQ0E7WUFDdkNBLENBQUNBO1lBQ0RBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLElBQUlBLElBQUlBLENBQUNBLENBQUNBLENBQUNBO2dCQUNqQkEsSUFBSUEsT0FBT0EsR0FBR0EsQ0FBQ0EsVUFBQ0EsSUFBSUEsSUFBS0EsT0FBQUEsVUFBQ0EsS0FBS0EsRUFBRUEsU0FBU0E7b0JBQ3hDQSxFQUFFQSxDQUFDQSxDQUFDQSxLQUFJQSxDQUFDQSxZQUFZQSxJQUFJQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDOUJBLEtBQUlBLENBQUNBLGdCQUFnQkEsRUFBRUEsQ0FBQ0E7d0JBQ3hCQSxLQUFJQSxDQUFDQSxZQUFZQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxJQUFJQSxTQUFTQSxDQUFDQSxTQUFTQSxFQUFFQSxLQUFLQSxDQUFDQSxDQUFDQTtvQkFDNURBLENBQUNBO29CQUNEQSxLQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxLQUFLQSxDQUFDQTtnQkFDL0JBLENBQUNBLEVBTndCQSxDQU14QkEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ2ZBLElBQUlBLENBQUNBLGNBQWNBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLEVBQUVBLE9B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QUNBLElBQUlBLHdCQUFtQkEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsT0FBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQzVGQSxDQUFDQTtZQUNIQSxDQUFDQTtRQUNIQSxDQUFDQTtJQUNIQSxDQUFDQTtJQUVETCxzREFBZUEsR0FBZkE7UUFBQU0saUJBRUNBO1FBRENBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBLElBQUlBLENBQUNBLFNBQVNBLEVBQUVBLGNBQU1BLE9BQUFBLEtBQUlBLENBQUNBLFdBQVdBLENBQUNBLG1CQUFtQkEsQ0FBQ0EsS0FBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsRUFBdERBLENBQXNEQSxDQUFDQSxDQUFDQTtJQUM3RkEsQ0FBQ0E7SUFDSE4sbUNBQUNBO0FBQURBLENBQUNBLEFBakpELElBaUpDO0FBakpZLG9DQUE0QiwrQkFpSnhDLENBQUE7QUFFRDtJQUNFTyxtQkFBbUJBLGFBQWtCQSxFQUFTQSxZQUFpQkE7UUFBNUNDLGtCQUFhQSxHQUFiQSxhQUFhQSxDQUFLQTtRQUFTQSxpQkFBWUEsR0FBWkEsWUFBWUEsQ0FBS0E7SUFBR0EsQ0FBQ0E7SUFFbkVELGlDQUFhQSxHQUFiQSxjQUEyQkUsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsYUFBYUEsS0FBS0EsSUFBSUEsQ0FBQ0EsWUFBWUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7SUFDL0VGLGdCQUFDQTtBQUFEQSxDQUFDQSxBQUpELElBSUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBwcm92aWRlLFxuICBBcHBWaWV3TWFuYWdlcixcbiAgQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gIEhvc3RWaWV3UmVmLFxuICBJbmplY3RvcixcbiAgT25DaGFuZ2VzLFxuICBQcm90b1ZpZXdSZWYsXG4gIFNpbXBsZUNoYW5nZVxufSBmcm9tICdhbmd1bGFyMi9jb3JlJztcbmltcG9ydCB7TkcxX1NDT1BFfSBmcm9tICcuL2NvbnN0YW50cyc7XG5pbXBvcnQge0NvbXBvbmVudEluZm99IGZyb20gJy4vbWV0YWRhdGEnO1xuaW1wb3J0IEVsZW1lbnQgPSBwcm90cmFjdG9yLkVsZW1lbnQ7XG5pbXBvcnQgKiBhcyBhbmd1bGFyIGZyb20gJy4vYW5ndWxhcl9qcyc7XG5cbmNvbnN0IElOSVRJQUxfVkFMVUUgPSB7XG4gIF9fVU5JTklUSUFMSVpFRF9fOiB0cnVlXG59O1xuXG5leHBvcnQgY2xhc3MgRG93bmdyYWRlTmcyQ29tcG9uZW50QWRhcHRlciB7XG4gIGNvbXBvbmVudDogYW55ID0gbnVsbDtcbiAgaW5wdXRDaGFuZ2VDb3VudDogbnVtYmVyID0gMDtcbiAgaW5wdXRDaGFuZ2VzOiB7W2tleTogc3RyaW5nXTogU2ltcGxlQ2hhbmdlfSA9IG51bGw7XG4gIGhvc3RWaWV3UmVmOiBIb3N0Vmlld1JlZiA9IG51bGw7XG4gIGNoYW5nZURldGVjdG9yOiBDaGFuZ2VEZXRlY3RvclJlZiA9IG51bGw7XG4gIGNvbXBvbmVudFNjb3BlOiBhbmd1bGFyLklTY29wZTtcbiAgY2hpbGROb2RlczogTm9kZVtdO1xuICBjb250ZW50SW5zZXJjdGlvblBvaW50OiBOb2RlID0gbnVsbDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGlkOiBzdHJpbmcsIHByaXZhdGUgaW5mbzogQ29tcG9uZW50SW5mbyxcbiAgICAgICAgICAgICAgcHJpdmF0ZSBlbGVtZW50OiBhbmd1bGFyLklBdWdtZW50ZWRKUXVlcnksIHByaXZhdGUgYXR0cnM6IGFuZ3VsYXIuSUF0dHJpYnV0ZXMsXG4gICAgICAgICAgICAgIHByaXZhdGUgc2NvcGU6IGFuZ3VsYXIuSVNjb3BlLCBwcml2YXRlIHBhcmVudEluamVjdG9yOiBJbmplY3RvcixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBwYXJzZTogYW5ndWxhci5JUGFyc2VTZXJ2aWNlLCBwcml2YXRlIHZpZXdNYW5hZ2VyOiBBcHBWaWV3TWFuYWdlcixcbiAgICAgICAgICAgICAgcHJpdmF0ZSBwcm90b1ZpZXc6IFByb3RvVmlld1JlZikge1xuICAgICg8YW55PnRoaXMuZWxlbWVudFswXSkuaWQgPSBpZDtcbiAgICB0aGlzLmNvbXBvbmVudFNjb3BlID0gc2NvcGUuJG5ldygpO1xuICAgIHRoaXMuY2hpbGROb2RlcyA9IDxOb2RlW10+PGFueT5lbGVtZW50LmNvbnRlbnRzKCk7XG4gIH1cblxuICBib290c3RyYXBOZzIoKSB7XG4gICAgdmFyIGNoaWxkSW5qZWN0b3IgPSB0aGlzLnBhcmVudEluamVjdG9yLnJlc29sdmVBbmRDcmVhdGVDaGlsZChcbiAgICAgICAgW3Byb3ZpZGUoTkcxX1NDT1BFLCB7dXNlVmFsdWU6IHRoaXMuY29tcG9uZW50U2NvcGV9KV0pO1xuICAgIHRoaXMuaG9zdFZpZXdSZWYgPVxuICAgICAgICB0aGlzLnZpZXdNYW5hZ2VyLmNyZWF0ZVJvb3RIb3N0Vmlldyh0aGlzLnByb3RvVmlldywgJyMnICsgdGhpcy5pZCwgY2hpbGRJbmplY3Rvcik7XG4gICAgdmFyIHJlbmRlcmVyOiBhbnkgPSAoPGFueT50aGlzLmhvc3RWaWV3UmVmKS5yZW5kZXI7XG4gICAgdmFyIGhvc3RFbGVtZW50ID0gdGhpcy52aWV3TWFuYWdlci5nZXRIb3N0RWxlbWVudCh0aGlzLmhvc3RWaWV3UmVmKTtcbiAgICB0aGlzLmNoYW5nZURldGVjdG9yID0gdGhpcy5ob3N0Vmlld1JlZi5jaGFuZ2VEZXRlY3RvclJlZjtcbiAgICB0aGlzLmNvbXBvbmVudCA9IHRoaXMudmlld01hbmFnZXIuZ2V0Q29tcG9uZW50KGhvc3RFbGVtZW50KTtcbiAgICB0aGlzLmNvbnRlbnRJbnNlcmN0aW9uUG9pbnQgPSByZW5kZXJlci5yb290Q29udGVudEluc2VydGlvblBvaW50c1swXTtcbiAgfVxuXG4gIHNldHVwSW5wdXRzKCk6IHZvaWQge1xuICAgIHZhciBhdHRycyA9IHRoaXMuYXR0cnM7XG4gICAgdmFyIGlucHV0cyA9IHRoaXMuaW5mby5pbnB1dHM7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpbnB1dHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBpbnB1dCA9IGlucHV0c1tpXTtcbiAgICAgIHZhciBleHByID0gbnVsbDtcbiAgICAgIGlmIChhdHRycy5oYXNPd25Qcm9wZXJ0eShpbnB1dC5hdHRyKSkge1xuICAgICAgICB2YXIgb2JzZXJ2ZUZuID0gKChwcm9wKSA9PiB7XG4gICAgICAgICAgdmFyIHByZXZWYWx1ZSA9IElOSVRJQUxfVkFMVUU7XG4gICAgICAgICAgcmV0dXJuICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuaW5wdXRDaGFuZ2VzICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgIHRoaXMuaW5wdXRDaGFuZ2VDb3VudCsrO1xuICAgICAgICAgICAgICB0aGlzLmlucHV0Q2hhbmdlc1twcm9wXSA9XG4gICAgICAgICAgICAgICAgICBuZXcgTmcxQ2hhbmdlKHZhbHVlLCBwcmV2VmFsdWUgPT09IElOSVRJQUxfVkFMVUUgPyB2YWx1ZSA6IHByZXZWYWx1ZSk7XG4gICAgICAgICAgICAgIHByZXZWYWx1ZSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5jb21wb25lbnRbcHJvcF0gPSB2YWx1ZTtcbiAgICAgICAgICB9O1xuICAgICAgICB9KShpbnB1dC5wcm9wKTtcbiAgICAgICAgYXR0cnMuJG9ic2VydmUoaW5wdXQuYXR0ciwgb2JzZXJ2ZUZuKTtcbiAgICAgIH0gZWxzZSBpZiAoYXR0cnMuaGFzT3duUHJvcGVydHkoaW5wdXQuYmluZEF0dHIpKSB7XG4gICAgICAgIGV4cHIgPSBhdHRyc1tpbnB1dC5iaW5kQXR0cl07XG4gICAgICB9IGVsc2UgaWYgKGF0dHJzLmhhc093blByb3BlcnR5KGlucHV0LmJyYWNrZXRBdHRyKSkge1xuICAgICAgICBleHByID0gYXR0cnNbaW5wdXQuYnJhY2tldEF0dHJdO1xuICAgICAgfSBlbHNlIGlmIChhdHRycy5oYXNPd25Qcm9wZXJ0eShpbnB1dC5iaW5kb25BdHRyKSkge1xuICAgICAgICBleHByID0gYXR0cnNbaW5wdXQuYmluZG9uQXR0cl07XG4gICAgICB9IGVsc2UgaWYgKGF0dHJzLmhhc093blByb3BlcnR5KGlucHV0LmJyYWNrZXRQYXJlbkF0dHIpKSB7XG4gICAgICAgIGV4cHIgPSBhdHRyc1tpbnB1dC5icmFja2V0UGFyZW5BdHRyXTtcbiAgICAgIH1cbiAgICAgIGlmIChleHByICE9IG51bGwpIHtcbiAgICAgICAgdmFyIHdhdGNoRm4gPSAoKHByb3ApID0+ICh2YWx1ZSwgcHJldlZhbHVlKSA9PiB7XG4gICAgICAgICAgaWYgKHRoaXMuaW5wdXRDaGFuZ2VzICE9IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRDaGFuZ2VDb3VudCsrO1xuICAgICAgICAgICAgdGhpcy5pbnB1dENoYW5nZXNbcHJvcF0gPSBuZXcgTmcxQ2hhbmdlKHByZXZWYWx1ZSwgdmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLmNvbXBvbmVudFtwcm9wXSA9IHZhbHVlO1xuICAgICAgICB9KShpbnB1dC5wcm9wKTtcbiAgICAgICAgdGhpcy5jb21wb25lbnRTY29wZS4kd2F0Y2goZXhwciwgd2F0Y2hGbik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHByb3RvdHlwZSA9IHRoaXMuaW5mby50eXBlLnByb3RvdHlwZTtcbiAgICBpZiAocHJvdG90eXBlICYmICg8T25DaGFuZ2VzPnByb3RvdHlwZSkubmdPbkNoYW5nZXMpIHtcbiAgICAgIC8vIERldGVjdDogT25DaGFuZ2VzIGludGVyZmFjZVxuICAgICAgdGhpcy5pbnB1dENoYW5nZXMgPSB7fTtcbiAgICAgIHRoaXMuY29tcG9uZW50U2NvcGUuJHdhdGNoKCgpID0+IHRoaXMuaW5wdXRDaGFuZ2VDb3VudCwgKCkgPT4ge1xuICAgICAgICB2YXIgaW5wdXRDaGFuZ2VzID0gdGhpcy5pbnB1dENoYW5nZXM7XG4gICAgICAgIHRoaXMuaW5wdXRDaGFuZ2VzID0ge307XG4gICAgICAgICg8T25DaGFuZ2VzPnRoaXMuY29tcG9uZW50KS5uZ09uQ2hhbmdlcyhpbnB1dENoYW5nZXMpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHRoaXMuY29tcG9uZW50U2NvcGUuJHdhdGNoKCgpID0+IHRoaXMuY2hhbmdlRGV0ZWN0b3IgJiYgdGhpcy5jaGFuZ2VEZXRlY3Rvci5kZXRlY3RDaGFuZ2VzKCkpO1xuICB9XG5cbiAgcHJvamVjdENvbnRlbnQoKSB7XG4gICAgdmFyIGNoaWxkTm9kZXMgPSB0aGlzLmNoaWxkTm9kZXM7XG4gICAgaWYgKHRoaXMuY29udGVudEluc2VyY3Rpb25Qb2ludCkge1xuICAgICAgdmFyIHBhcmVudCA9IHRoaXMuY29udGVudEluc2VyY3Rpb25Qb2ludC5wYXJlbnROb2RlO1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gY2hpbGROb2Rlcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUoY2hpbGROb2Rlc1tpXSwgdGhpcy5jb250ZW50SW5zZXJjdGlvblBvaW50KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBzZXR1cE91dHB1dHMoKSB7XG4gICAgdmFyIGF0dHJzID0gdGhpcy5hdHRycztcbiAgICB2YXIgb3V0cHV0cyA9IHRoaXMuaW5mby5vdXRwdXRzO1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgb3V0cHV0cy5sZW5ndGg7IGorKykge1xuICAgICAgdmFyIG91dHB1dCA9IG91dHB1dHNbal07XG4gICAgICB2YXIgZXhwciA9IG51bGw7XG4gICAgICB2YXIgYXNzaWduRXhwciA9IGZhbHNlO1xuXG4gICAgICB2YXIgYmluZG9uQXR0ciA9XG4gICAgICAgICAgb3V0cHV0LmJpbmRvbkF0dHIgPyBvdXRwdXQuYmluZG9uQXR0ci5zdWJzdHJpbmcoMCwgb3V0cHV0LmJpbmRvbkF0dHIubGVuZ3RoIC0gNikgOiBudWxsO1xuICAgICAgdmFyIGJyYWNrZXRQYXJlbkF0dHIgPVxuICAgICAgICAgIG91dHB1dC5icmFja2V0UGFyZW5BdHRyID9cbiAgICAgICAgICAgICAgYFsoJHtvdXRwdXQuYnJhY2tldFBhcmVuQXR0ci5zdWJzdHJpbmcoMiwgb3V0cHV0LmJyYWNrZXRQYXJlbkF0dHIubGVuZ3RoIC0gOCl9KV1gIDpcbiAgICAgICAgICAgICAgbnVsbDtcblxuICAgICAgaWYgKGF0dHJzLmhhc093blByb3BlcnR5KG91dHB1dC5vbkF0dHIpKSB7XG4gICAgICAgIGV4cHIgPSBhdHRyc1tvdXRwdXQub25BdHRyXTtcbiAgICAgIH0gZWxzZSBpZiAoYXR0cnMuaGFzT3duUHJvcGVydHkob3V0cHV0LnBhcmVuQXR0cikpIHtcbiAgICAgICAgZXhwciA9IGF0dHJzW291dHB1dC5wYXJlbkF0dHJdO1xuICAgICAgfSBlbHNlIGlmIChhdHRycy5oYXNPd25Qcm9wZXJ0eShiaW5kb25BdHRyKSkge1xuICAgICAgICBleHByID0gYXR0cnNbYmluZG9uQXR0cl07XG4gICAgICAgIGFzc2lnbkV4cHIgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChhdHRycy5oYXNPd25Qcm9wZXJ0eShicmFja2V0UGFyZW5BdHRyKSkge1xuICAgICAgICBleHByID0gYXR0cnNbYnJhY2tldFBhcmVuQXR0cl07XG4gICAgICAgIGFzc2lnbkV4cHIgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoZXhwciAhPSBudWxsICYmIGFzc2lnbkV4cHIgIT0gbnVsbCkge1xuICAgICAgICB2YXIgZ2V0dGVyID0gdGhpcy5wYXJzZShleHByKTtcbiAgICAgICAgdmFyIHNldHRlciA9IGdldHRlci5hc3NpZ247XG4gICAgICAgIGlmIChhc3NpZ25FeHByICYmICFzZXR0ZXIpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cHJlc3Npb24gJyR7ZXhwcn0nIGlzIG5vdCBhc3NpZ25hYmxlIWApO1xuICAgICAgICB9XG4gICAgICAgIHZhciBlbWl0dGVyID0gdGhpcy5jb21wb25lbnRbb3V0cHV0LnByb3BdO1xuICAgICAgICBpZiAoZW1pdHRlcikge1xuICAgICAgICAgIGVtaXR0ZXIuc3Vic2NyaWJlKHtcbiAgICAgICAgICAgIG5leHQ6IGFzc2lnbkV4cHIgPyAoKHNldHRlcikgPT4gKHZhbHVlKSA9PiBzZXR0ZXIodGhpcy5zY29wZSwgdmFsdWUpKShzZXR0ZXIpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKGdldHRlcikgPT4gKHZhbHVlKSA9PiBnZXR0ZXIodGhpcy5zY29wZSwgeyRldmVudDogdmFsdWV9KSkoZ2V0dGVyKVxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTWlzc2luZyBlbWl0dGVyICcke291dHB1dC5wcm9wfScgb24gY29tcG9uZW50ICcke3RoaXMuaW5mby5zZWxlY3Rvcn0nIWApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmVnaXN0ZXJDbGVhbnVwKCkge1xuICAgIHRoaXMuZWxlbWVudC5iaW5kKCckcmVtb3ZlJywgKCkgPT4gdGhpcy52aWV3TWFuYWdlci5kZXN0cm95Um9vdEhvc3RWaWV3KHRoaXMuaG9zdFZpZXdSZWYpKTtcbiAgfVxufVxuXG5jbGFzcyBOZzFDaGFuZ2UgaW1wbGVtZW50cyBTaW1wbGVDaGFuZ2Uge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgcHJldmlvdXNWYWx1ZTogYW55LCBwdWJsaWMgY3VycmVudFZhbHVlOiBhbnkpIHt9XG5cbiAgaXNGaXJzdENoYW5nZSgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMucHJldmlvdXNWYWx1ZSA9PT0gdGhpcy5jdXJyZW50VmFsdWU7IH1cbn1cbiJdfQ==