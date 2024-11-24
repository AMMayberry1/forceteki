import AbilityHelper from '../../../AbilityHelper';
import { LeaderUnitCard } from '../../../core/card/LeaderUnitCard';
import { RelativePlayer, WildcardCardType } from '../../../core/Constants';

export default class EmperorPalpatineGalacticRuler extends LeaderUnitCard {
    protected override getImplementationId() {
        return {
            id: '5784497124',
            internalName: 'emperor-palpatine#galactic-ruler',
        };
    }

    protected override setupLeaderSideAbilities() {
        this.addActionAbility({
            // TODO: how do we want to handle prompts for targeting costs (i.e. the defeat unit cost)?
            title: 'Deal 1 damage to a unit and draw a card',
            cost: [
                AbilityHelper.costs.abilityResourceCost(1),
                AbilityHelper.costs.exhaustSelf(),
                AbilityHelper.costs.defeat({
                    cardTypeFilter: WildcardCardType.Unit,
                    controller: RelativePlayer.Self
                })
            ],
            immediateEffect: AbilityHelper.immediateEffects.simultaneous([
                AbilityHelper.immediateEffects.selectCard({
                    cardTypeFilter: WildcardCardType.Unit,
                    innerSystem: AbilityHelper.immediateEffects.damage({ amount: 1 })
                }),
                AbilityHelper.immediateEffects.draw((context) => ({ target: context.source.controller }))
            ])
        });
    }

    protected override setupLeaderUnitSideAbilities() {
        this.addTriggeredAbility({
            title: 'Take control of a damaged non-leader unit',
            when: {
                onLeaderDeployed: (event, context) => event.card === context.source
            },
            targetResolver: {
                cardCondition: (card) => card.isNonLeaderUnit() && card.damage > 0,
                immediateEffect: AbilityHelper.immediateEffects.takeControlOfUnit((context) => ({ newController: context.source.controller }))
            }
        });

        this.addOnAttackAbility({
            title: 'Defeat another friendly unit',
            optional: true,
            targetResolver: {
                cardTypeFilter: WildcardCardType.Unit,
                controller: RelativePlayer.Self,
                cardCondition: (card, context) => card !== context.source,
                immediateEffect: AbilityHelper.immediateEffects.defeat()
            },
            ifYouDo: {
                title: 'Deal 1 damage to a unit and draw a card',
                immediateEffect: AbilityHelper.immediateEffects.simultaneous([
                    AbilityHelper.immediateEffects.selectCard({
                        cardTypeFilter: WildcardCardType.Unit,
                        innerSystem: AbilityHelper.immediateEffects.damage({ amount: 1 })
                    }),
                    AbilityHelper.immediateEffects.draw((context) => ({ target: context.source.controller }))
                ])
            }
        });
    }
}

EmperorPalpatineGalacticRuler.implemented = true;
