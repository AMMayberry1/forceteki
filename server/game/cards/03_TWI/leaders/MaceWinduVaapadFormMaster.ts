import AbilityHelper from '../../../AbilityHelper';
import { LeaderUnitCard } from '../../../core/card/LeaderUnitCard';
import { RelativePlayer, WildcardCardType, WildcardZoneName } from '../../../core/Constants';

export default class MaceWinduVaapadFormMaster extends LeaderUnitCard {
    protected override getImplementationId() {
        return {
            id: '4628885755',
            internalName: 'mace-windu#vaapad-form-master',
        };
    }

    protected override setupLeaderSideAbilities() {
        this.addActionAbility({
            title: 'Deal 1 damage to a damaged enemy unit. Then, if it has 5 or more damage on it, deal 1 damage to it.',
            cost: [AbilityHelper.costs.exhaustSelf(), AbilityHelper.costs.abilityResourceCost(1)],
            targetResolver: {
                cardTypeFilter: WildcardCardType.Unit,
                controller: RelativePlayer.Opponent,
                cardCondition: (card) => card.isUnit() && card.damage > 0,
                immediateEffect: AbilityHelper.immediateEffects.damage({ amount: 1 })
            },
            then: (thenContext) => ({
                title: 'If it has 5 or more damage on it, deal 1 damage to it',
                immediateEffect: AbilityHelper.immediateEffects.conditional({
                    condition: () => thenContext.target.isUnit() && thenContext.target.damage >= 5,
                    onFalse: AbilityHelper.immediateEffects.noAction(),
                    onTrue: AbilityHelper.immediateEffects.damage({ amount: 1, target: thenContext.target })
                })
            })
        });
    }

    protected override setupLeaderUnitSideAbilities() {
        this.addTriggeredAbility({
            title: 'Deal 2 damage to each damaged enemy unit.',
            when: {
                onLeaderDeployed: (event, context) => event.card === context.source
            },
            immediateEffect: AbilityHelper.immediateEffects.damage((context) => ({
                target: context.source.controller.opponent.getUnitsInPlay(WildcardZoneName.AnyArena, (card) => card.isUnit() && card.damage > 0),
                amount: 2
            })),
        });
    }
}

MaceWinduVaapadFormMaster.implemented = true;
