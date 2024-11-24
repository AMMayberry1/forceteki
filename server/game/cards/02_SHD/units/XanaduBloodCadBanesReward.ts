import AbilityHelper from '../../../AbilityHelper';
import { NonLeaderUnitCard } from '../../../core/card/NonLeaderUnitCard';
import { RelativePlayer, TargetMode, Trait, WildcardCardType } from '../../../core/Constants';

export default class XanaduBloodCadBanesReward extends NonLeaderUnitCard {
    protected override getImplementationId() {
        return {
            id: '5818136044',
            internalName: 'xanadu-blood#cad-banes-reward',
        };
    }

    public override setupCardAbilities() {
        this.addTriggeredAbility({
            title: 'Return another friendly non-leader Underworld unit to its owner’s hand',
            when: {
                onCardPlayed: (event, context) => event.card === context.source,
                onAttackDeclared: (event, context) => event.attack.attacker === context.source,
            },
            optional: true,
            targetResolver: {
                controller: RelativePlayer.Self,
                cardTypeFilter: WildcardCardType.Unit,
                cardCondition: (card, context) => card !== context.source && card.hasSomeTrait(Trait.Underworld),
                immediateEffect: AbilityHelper.immediateEffects.returnToHand()
            },
            ifYouDo: {
                title: 'Exhaust an enemy unit or resource',
                targetResolver: {
                    mode: TargetMode.Select,
                    choices: {
                        ['Exhaust an enemy resource']: AbilityHelper.immediateEffects.exhaustResources({ amount: 1 }),
                        ['Exhaust an enemy unit']: AbilityHelper.immediateEffects.selectCard({
                            controller: RelativePlayer.Opponent,
                            cardTypeFilter: WildcardCardType.Unit,
                            innerSystem: AbilityHelper.immediateEffects.exhaust()
                        }),
                    }
                }
            }
        });
    }
}

XanaduBloodCadBanesReward.implemented = true;
