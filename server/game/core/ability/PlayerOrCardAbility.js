const { CardTargetResolver } = require('./abilityTargets/CardTargetResolver.js');
const { SelectTargetResolver } = require('./abilityTargets/SelectTargetResolver.js');
const { Stage, TargetMode, AbilityType } = require('../Constants.js');
const { GameEvent } = require('../event/GameEvent.js');
const Contract = require('../utils/Contract.js');
const { GameSystem } = require('../gameSystem/GameSystem.js');
const { v4: uuidv4 } = require('uuid');
const { PlayerTargetResolver } = require('./abilityTargets/PlayerTargetResolver.js');
const { DropdownListTargetResolver } = require('./abilityTargets/DropdownListTargetResolver.js');
const { TriggerHandlingMode } = require('../event/EventWindow.js');

// TODO: convert to TS and make this abstract
/**
 * Base class representing an ability that can be done by the player
 * or triggered by card text. This includes card actions, reactions,
 * interrupts, playing a card.
 *
 * Most of the methods take a context object. While the structure will vary from
 * inheriting classes, it is guaranteed to have at least the `game` object, the
 * `player` that is executing the action, and the `source` card object that the
 * ability is generated from.
 */
class PlayerOrCardAbility {
    /**
     * Creates an ability.
     *
     * @param {Object} properties - An object with ability related properties.
     * @param {Object|Array} [properties.cost] - optional property that specifies
     * the cost for the ability. Can either be a cost object or an array of cost
     * objects.
     * @param {Object} [properties.target] - Optional property that specifies the target of the ability.
     * @param {GameSystem} [properties.immediateEffect] - Optional GameSystem without a target resolver
     * @param {any} [properties.targetResolver] - Optional target resolver
     * @param {any} [properties.targetResolvers] - Optional target resolvers set
     * @param {string} [properties.title] - Name to use for ability display and debugging
     * @param {string} [properties.cardName] - Optional property that specifies the name of the card, if any
     * @param {boolean} [properties.optional] - Optional property that indicates if resolution of the ability is optional and may be passed through
     * @param {import('../event/EventWindow.js').TriggerHandlingMode} [properties.triggerHandlingMode] - Optional property that indicates whether triggers triggered during this
     * ability should be resolved right after it, or passed back to the parent game event window
     */
    constructor(properties, type = AbilityType.Action) {
        Contract.assertStringValue(properties.title);

        const hasImmediateEffect = properties.immediateEffect != null;
        const hasTargetResolver = properties.targetResolver != null;
        const hasTargetResolvers = properties.targetResolvers != null;

        const systemTypesCount = [hasImmediateEffect, hasTargetResolver, hasTargetResolvers].reduce(
            (acc, val) => acc + (val ? 1 : 0), 0,
        );

        Contract.assertFalse(systemTypesCount > 1, 'Cannot create ability with multiple system initialization properties');

        this.title = properties.title;
        this.limit = null;
        this.keyword = null;
        this.type = type;
        this.optional = !!properties.optional;
        this.immediateEffect = properties.immediateEffect;
        this.uuid = uuidv4();

        // TODO: Ensure that nested abilities(triggers resolving during a trigger resolution) are resolving as expected.

        if (properties.triggerHandlingMode != null) {
            this.triggerHandlingMode = properties.triggerHandlingMode;
        } else {
            this.triggerHandlingMode = [AbilityType.Triggered, AbilityType.Action].includes(this.type)
                ? TriggerHandlingMode.ResolvesTriggers
                : TriggerHandlingMode.PassesTriggersToParentWindow;
        }

        this.buildTargetResolvers(properties);
        this.cost = this.buildCost(properties.cost);
        for (const cost of this.cost) {
            if (cost.dependsOn) {
                let dependsOnTarget = this.targetResolvers.find((target) => target.name === cost.dependsOn);
                dependsOnTarget.dependentCost = cost;
            }
        }
        this.nonDependentTargets = this.targetResolvers.filter((target) => !target.properties.dependsOn);
        this.toStringName = properties.cardName
            ? `'${properties.cardName} ability: ${this.title}'`
            : `'Ability: ${this.title}'`;
    }

    toString() {
        return this.toStringName;
    }

    buildCost(cost) {
        if (!cost) {
            return [];
        }

        if (!Array.isArray(cost)) {
            return [cost];
        }

        return cost;
    }

    buildTargetResolvers(properties) {
        this.targetResolvers = [];
        if (properties.targetResolver) {
            this.targetResolvers.push(this.buildTargetResolver('target', properties.targetResolver));
        } else if (properties.targetResolvers) {
            for (const key of Object.keys(properties.targetResolvers)) {
                this.targetResolvers.push(this.buildTargetResolver(key, properties.targetResolvers[key]));
            }
        }
    }

    buildTargetResolver(name, properties) {
        switch (properties.mode) {
            case TargetMode.Select:
                return new SelectTargetResolver(name, properties, this);
            case TargetMode.DropdownList:
                return new DropdownListTargetResolver(name, properties, this);
            case TargetMode.Player:
            case TargetMode.MultiplePlayers:
                return new PlayerTargetResolver(name, properties, this);
            case TargetMode.AutoSingle:
            case TargetMode.Exactly:
            case TargetMode.ExactlyVariable:
            case TargetMode.MaxStat:
            case TargetMode.Single:
            case TargetMode.Unlimited:
            case TargetMode.UpTo:
            case TargetMode.UpToVariable:
            case null:
            case undefined: // CardTargetResolver contains behavior that defaults the mode to TargetMode.Single if it is not defined yet.
                return new CardTargetResolver(name, properties, this);
            default:
                Contract.fail(`Attempted to create a TargetResolver with unsupported mode ${properties.mode}`);
        }
    }

    /**
     * @param {*} context
     * @returns {String}
     */
    meetsRequirements(context, ignoredRequirements = []) {
        // check legal targets exist
        // check costs can be paid
        // check for potential to change game state
        if (!ignoredRequirements.includes('cost') && !this.canPayCosts(context)) {
            return 'cost';
        }

        // we don't check whether a triggered ability has legal targets at the trigger stage, that's evaluated at ability resolution
        if (context.stage === Stage.Trigger && this.isTriggeredAbility()) {
            return '';
        }

        // for actions, the only requirement to be legal to activate is that something changes game state. so if there's a resolvable cost, that's enough (see SWU 6.2.C)
        // TODO: add a card with an action that has no cost (e.g. Han red or Fennec) and confirm that the action is not legal to activate when there are no targets
        if (this.isAction()) {
            if (this.getCosts(context).length > 0) {
                return '';
            }
        }

        if (this.immediateEffect && !this.checkGameActionsForPotential(context)) {
            return 'gameStateChange';
        }

        if (this.targetResolvers.length > 0 && !this.canResolveSomeTarget(context)) {
            return 'target';
        }

        return '';
    }

    hasAnyLegalEffects(context) {
        if (this.immediateEffect && this.checkGameActionsForPotential(context)) {
            return true;
        }

        if (this.targetResolvers.length > 0 && this.canResolveSomeTarget(context)) {
            return true;
        }

        return false;
    }

    checkGameActionsForPotential(context) {
        return this.immediateEffect.hasLegalTarget(context);
    }

    /**
     * Return whether all costs are capable of being paid for the ability.
     *
     * @returns {Boolean}
     */
    canPayCosts(context) {
        let contextCopy = context.copy({ stage: Stage.Cost });
        return this.getCosts(context).every((cost) => cost.canPay(contextCopy));
    }


    getCosts(context, playCosts = true, triggerCosts = true) {
        let costs = this.cost.map((a) => a);
        if (context.ignoreResourceCost) { // TODO: Add more complex logic in Play For Free PR
            costs = costs.filter((cost) => !cost.isPrintedResourceCost);
        }

        if (!playCosts) {
            costs = costs.filter((cost) => !cost.isPlayCost);
        }
        return costs;
    }

    resolveCosts(context, results) {
        for (let cost of this.getCosts(context, results.playCosts, results.triggerCosts)) {
            context.game.queueSimpleStep(() => {
                if (!results.cancelled) {
                    if (cost.queueGenerateEventGameSteps) {
                        cost.queueGenerateEventGameSteps(results.events, context, results);
                    } else {
                        if (cost.resolve) {
                            cost.resolve(context, results);
                        }
                        context.game.queueSimpleStep(() => {
                            if (!results.cancelled) {
                                let newEvents = cost.payEvent
                                    ? cost.payEvent(context)
                                    : new GameEvent('payCost', context, {}, () => cost.pay(context));
                                if (Array.isArray(newEvents)) {
                                    for (let event of newEvents) {
                                        results.events.push(event);
                                    }
                                } else {
                                    results.events.push(newEvents);
                                }
                            }
                        }, `Generate cost events for ${cost.gameSystem ? cost.gameSystem : cost.constructor.name} for ${this}`);
                    }
                }
            }, `Resolve cost '${cost.gameSystem ? cost.gameSystem : cost.constructor.name}' for ${this}`);
        }
    }

    /**
     * Returns whether there are eligible cards available to fulfill targets.
     *
     * @returns {Boolean}
     */
    canResolveSomeTarget(context) {
        return this.nonDependentTargets.some((target) => target.canResolve(context));
    }

    /**
     * Prompts the current player to choose each target defined for the ability.
     */
    resolveTargets(context, passHandler = null) {
        let targetResults = {
            canIgnoreAllCosts:
                context.stage === Stage.PreTarget ? this.cost.every((cost) => cost.canIgnoreForTargeting) : false,
            cancelled: false,
            payCostsFirst: false,
            delayTargeting: null
        };
        for (let target of this.targetResolvers) {
            context.game.queueSimpleStep(() => target.resolve(context, targetResults, passHandler), `Resolve target '${target.name}' for ${this}`);
        }
        return targetResults;
    }

    resolveRemainingTargets(context, nextTarget, passHandler = null) {
        const index = this.targetResolvers.indexOf(nextTarget);
        let targets = this.targetResolvers.slice();
        if (targets.slice(0, index).every((target) => target.checkTarget(context))) {
            targets = targets.slice(index);
        }
        let targetResults = {};
        for (const target of targets) {
            context.game.queueSimpleStep(() => target.resolve(context, targetResults, passHandler), `Resolve target '${target.name}' for ${this}`);
        }
        return targetResults;
    }

    hasTargets() {
        return this.nonDependentTargets.length > 0;
    }

    hasSomeLegalTarget(context) {
        return this.nonDependentTargets.some((target) => target.hasLegalTarget(context));
    }

    checkAllTargets(context) {
        return this.nonDependentTargets.every((target) => target.checkTarget(context));
    }

    hasTargetsChosenByInitiatingPlayer(context) {
        return (
            this.targetResolvers.some((target) => target.hasTargetsChosenByInitiatingPlayer(context)) ||
            this.immediateEffect.hasTargetsChosenByInitiatingPlayer(context) ||
            this.cost.some(
                (cost) => cost.hasTargetsChosenByInitiatingPlayer && cost.hasTargetsChosenByInitiatingPlayer(context)
            )
        );
    }


    displayMessage(context) {}

    /**
     * Executes the ability once all costs have been paid. Inheriting classes
     * should override this method to implement their behavior; by default it
     * does nothing.
     */

    executeHandler(context) {}

    isAction() {
        return this.type === AbilityType.Action;
    }

    isTriggeredAbility() {
        return this.type === AbilityType.Triggered;
    }

    // TODO: refactor the other methods to also be type predicates
    /**
     * Indicates whether a card is played as part of the resolution this ability
     * @returns {this is import('./PlayCardAction.js').PlayCardAction}
     */
    isCardPlayed() {
        return false;
    }

    /** Indicates whether this ability is an ability from card text as opposed to other types of actions like playing a card */
    isCardAbility() {
        return false;
    }

    /** Indicates whether this ability is an "activated" ability on a card, as opposed to a constant ability */
    isActivatedAbility() {
        return false;
    }

    isKeywordAbility() {
        return false;
    }

    /** @returns {this is import('../../actions/InitiateAttackAction.js').InitiateAttackAction} */
    isAttackAction() {
        return false;
    }
}

module.exports = PlayerOrCardAbility;
