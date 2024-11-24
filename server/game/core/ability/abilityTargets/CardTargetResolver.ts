import { ICardTargetResolver, ICardTargetsResolver } from '../../../TargetInterfaces';
import { AbilityContext } from '../AbilityContext';
import PlayerOrCardAbility from '../PlayerOrCardAbility';
import { TargetResolver } from './TargetResolver';
import CardSelectorFactory from '../../cardSelector/CardSelectorFactory';
import { Card } from '../../card/Card';
import { Stage, EffectName, ZoneFilter, RelativePlayer, GameStateChangeRequired } from '../../Constants';
import type Player from '../../Player';
import * as Contract from '../../utils/Contract';
import * as Helpers from '../../utils/Helpers.js';
import * as EnumHelpers from '../../utils/EnumHelpers.js';
import { GameSystem } from '../../gameSystem/GameSystem';

/**
 * Target resolver for selecting cards for the target of an effect.
 */
export class CardTargetResolver extends TargetResolver<ICardTargetsResolver<AbilityContext>> {
    private immediateEffect: GameSystem;
    private selector: any;

    private static choosingFromHiddenPrompt = '(because you are choosing from a hidden zone you may choose nothing)';

    public static allZonesAreHidden(zoneFilter: ZoneFilter | ZoneFilter[], controller: RelativePlayer): boolean {
        return zoneFilter && zoneFilter.length > 0 && Helpers.asArray(zoneFilter).every((zone) => EnumHelpers.isHidden(zone, controller));
    }

    public constructor(name: string, properties: ICardTargetResolver<AbilityContext>, ability: PlayerOrCardAbility) {
        super(name, properties, ability);

        if ('canChooseNoCards' in this.properties) {
            this.properties.optional = this.properties.optional || this.properties.canChooseNoCards;
        }

        this.selector = this.getSelector(properties);
        this.immediateEffect = properties.immediateEffect;

        if (this.properties.immediateEffect) {
            this.properties.immediateEffect.setDefaultTargetFn((context) => context.targets[name]);
        }

        this.validateZoneLegalForTarget(properties);
    }

    private getSelector(properties: ICardTargetResolver<AbilityContext>) {
        const cardCondition = (card, context) => {
            const contextCopy = this.getContextCopy(card, context);
            if (context.stage === Stage.PreTarget && this.dependentCost && !this.dependentCost.canPay(contextCopy)) {
                return false;
            }
            return (!this.dependentTarget || this.dependentTarget.hasLegalTarget(contextCopy)) &&
              (!properties.cardCondition || properties.cardCondition(card, contextCopy)) &&
              (properties.immediateEffect == null || properties.immediateEffect.hasLegalTarget(contextCopy, this.properties.mustChangeGameState));
        };
        return CardSelectorFactory.create(Object.assign({}, properties, { cardCondition: cardCondition, targets: true }));
    }

    private getContextCopy(card: Card, context: AbilityContext) {
        const contextCopy = context.copy();
        contextCopy.targets[this.name] = card;
        if (this.name === 'target') {
            contextCopy.target = card;
        }
        return contextCopy;
    }

    protected override hasLegalTarget(context: AbilityContext) {
        return this.selector.optional || this.selector.hasEnoughTargets(context, this.getChoosingPlayer(context));
    }

    private getAllLegalTargets(context: AbilityContext): Card[] {
        return this.selector.getAllLegalTargets(context, this.getChoosingPlayer(context));
    }

    protected override resolveInner(context: AbilityContext, targetResults, passPrompt, player: Player) {
        // A player can always choose not to pick a card from a zone that is hidden from their opponents
        // if doing so would reveal hidden information(i.e. that there are one or more valid cards in that zone) (SWU Comp Rules 2.0 1.17.4)
        // TODO: test if picking a card from an opponent's usually hidden zone(e.g. opponent's hand) works as expected(the if block here should be skipped)
        let choosingFromHidden = false;
        const choosingPlayer = typeof this.properties.choosingPlayer === 'function' ? this.properties.choosingPlayer(context) : this.properties.choosingPlayer;
        if (CardTargetResolver.allZonesAreHidden(this.properties.zoneFilter, choosingPlayer) && this.selector.hasAnyCardFilter) {
            this.properties.optional = true;
            this.selector.optional = true;
            this.selector.oldDefaultActivePromptTitle = this.selector.defaultActivePromptTitle();
            this.selector.defaultActivePromptTitle = () => this.selector.oldDefaultActivePromptTitle.concat(' ' + CardTargetResolver.choosingFromHiddenPrompt);
            choosingFromHidden = true;
        }

        const legalTargets = this.selector.getAllLegalTargets(context, player);
        if (legalTargets.length === 0) {
            if (context.stage === Stage.PreTarget) {
                // if there are no targets at the pretarget stage, delay targeting until after costs are paid
                targetResults.delayTargeting = this;
                return;
            }
            return;
        }

        // if there are legal targets but this wouldn't have a gamestate-changing effect on any of them, we can just shortcut and skip selection
        // (unless there are dependent targets that might care about the targeting result)
        // also, some complex implementations(e.g. Don't Get Cocky) use a targetResolver with no immediateEffect to have the player choose a target for referencing later
        // these will appear to have no effect on any target, but should not be skipped
        if (
            !this.dependentTarget &&
            this.immediateEffect &&
            !legalTargets.some((target) => this.immediateEffect.canAffect(
                target,
                this.getContextCopy(target, context),
                {},
                GameStateChangeRequired.MustFullyOrPartiallyResolve
            ))
        ) {
            targetResults.hasEffectiveTargets = targetResults.hasEffectiveTargets || false;
            return;
        }

        targetResults.hasEffectiveTargets = true;

        // if there's only one target available...
        if (context.player.autoSingleTarget && legalTargets.length === 1) {
            // ...and we are an optional resolver, prompt the player if they want to resolve
            if (this.selector.optional) {
                this.promptForSingleOptionalTarget(context, legalTargets[0], choosingFromHidden);
                return;
            }

            // ...and we are a non-optional resolver, auto-select
            this.setTargetResult(context, legalTargets[0]);
            return;
        }

        // create a copy of properties without cardCondition
        let extractedProperties;
        {
            const { cardCondition, ...otherProperties } = this.properties;
            extractedProperties = otherProperties;
        }

        const buttons = [];
        if (context.stage === Stage.PreTarget) {
            // TODO: figure out if we need these buttons
            /* if (!targetResults.noCostsFirstButton) {
                buttons.push({ text: 'Pay costs first', arg: 'costsFirst' });
            }
            buttons.push({ text: 'Cancel', arg: 'cancel' });*/
            if (passPrompt) {
                buttons.push({ text: passPrompt.buttonText, arg: passPrompt.arg });
                passPrompt.hasBeenShown = true;
            }
            if (this.selector.optional) {
                // If the selector is for a single card and it will automatically fire on selection,
                // uses the 'done' arg so that the prompt doesn't show both 'Choose no target' and 'Done' buttons.
                buttons.push({
                    text: 'Choose no target',
                    arg: this.selector.numCards === 1 && this.selector.automaticFireOnSelect(context) ? 'done' : 'noTarget'
                });
            }
        }
        const mustSelect = legalTargets.filter((card) =>
            card.getOngoingEffectValues(EffectName.MustBeChosen).some((restriction) => restriction.isMatch('target', context))
        );

        const promptProperties = Object.assign(this.getDefaultProperties(context), {
            selector: this.selector,
            buttons: buttons,
            mustSelect: mustSelect,
            onSelect: (player, card) => {
                this.setTargetResult(context, card);
                return true;
            },
            onCancel: () => {
                this.cancel(targetResults);
                return true;
            },
            onMenuCommand: (player: Player, arg) => {
                switch (arg) {
                    case 'costsFirst':
                        targetResults.payCostsFirst = true;
                        return true;

                    case passPrompt?.arg:
                        this.cancel(targetResults);
                        passPrompt.handler();
                        return true;

                    case 'cancel':
                    case 'noTarget':
                        return true;

                    default:
                        Contract.fail(`Unknown menu option '${arg}'`);
                }
            }
        });
        context.game.promptForSelect(player, Object.assign(promptProperties, extractedProperties));
    }

    private promptForSingleOptionalTarget(context: AbilityContext, target: Card, choosingFromHidden: boolean) {
        const effectName = this.properties.activePromptTitle ? this.properties.activePromptTitle : context.ability.title;

        const activePromptTitle = `Trigger the effect '${effectName}' on target '${target.title}' or pass${choosingFromHidden ? ' ' + CardTargetResolver.choosingFromHiddenPrompt : ''}`;

        context.game.promptWithHandlerMenu(context.player, {
            activePromptTitle,
            choices: [`${effectName} -> ${target.title}`, 'Pass'],
            handlers: [
                () => this.setTargetResult(context, target),
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                () => {}
            ]
        });
    }

    private cancel(targetResults) {
        targetResults.cancelled = true;
    }

    protected override checkTarget(context: AbilityContext): boolean {
        if (!context.targets[this.name]) {
            return false;
        } else if (context.choosingPlayerOverride && this.getChoosingPlayer(context) === context.player) {
            return false;
        }
        let cards = context.targets[this.name];
        if (!Array.isArray(cards)) {
            cards = [cards];
        }
        return (cards.every((card) => this.selector.canTarget(card, context, context.choosingPlayerOverride || this.getChoosingPlayer(context))) &&
          this.selector.hasEnoughSelected(cards, context) && !this.selector.hasExceededLimit(cards, context));
    }

    protected override hasTargetsChosenByInitiatingPlayer(context: AbilityContext) {
        if (this.getChoosingPlayer(context) === context.player && (this.selector.optional || this.selector.hasEnoughTargets(context, context.player.opponent))) {
            return true;
        }
        return !this.properties.dependsOn && this.checkGameActionsForTargetsChosenByInitiatingPlayer(context);
    }

    private checkGameActionsForTargetsChosenByInitiatingPlayer(context: AbilityContext) {
        return this.getAllLegalTargets(context).some((card) => {
            const contextCopy = this.getContextCopy(card, context);
            if (this.properties.immediateEffect && this.properties.immediateEffect.hasTargetsChosenByInitiatingPlayer(contextCopy)) {
                return true;
            } else if (this.dependentTarget) {
                return this.dependentTarget.checkGameActionsForTargetsChosenByInitiatingPlayer(contextCopy);
            }
            return false;
        });
    }

    /**
     * Checks whether the target's provided zone filters have at least one legal zone for the provided
     * card types. This is to catch situations in which a mismatched zone and card type was accidentally
     * provided, which would cause target resolution to always silently fail to find any legal targets.
     */
    private validateZoneLegalForTarget(properties) {
        if (!properties.zoneFilter || !properties.cardTypeFilter) {
            return;
        }

        for (const type of Array.isArray(properties.cardTypeFilter) ? properties.cardTypeFilter : [properties.cardTypeFilter]) {
            const legalZones = Helpers.defaultLegalZonesForCardTypeFilter(type);
            if (legalZones.some((zone) => EnumHelpers.cardZoneMatches(zone, properties.zoneFilter))) {
                return;
            }
        }

        Contract.fail(`Target zone filters '${properties.zoneFilter}' for ability has no overlap with legal zones for target card types '${properties.cardTypeFilter}', so target resolution is guaranteed to find no legal targets`);
    }
}