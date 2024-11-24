import AbilityHelper from '../../../AbilityHelper';
import { LeaderUnitCard } from '../../../core/card/LeaderUnitCard';
import { RelativePlayer, WildcardCardType } from '../../../core/Constants';

export default class GrandInquisitorHuntingTheJedi extends LeaderUnitCard {
    protected override getImplementationId() {
        return {
            id: '7911083239',
            internalName: 'grand-inquisitor#hunting-the-jedi',
        };
    }

    protected override setupLeaderSideAbilities() {
        this.addActionAbility({
            title: 'Deal 2 damage to a friendly unit with 3 or less power and ready it',
            cost: AbilityHelper.costs.exhaustSelf(),
            targetResolver: {
                controller: RelativePlayer.Self,
                cardTypeFilter: WildcardCardType.Unit,
                cardCondition: (card) => card.isUnit() && card.getPower() <= 3,
                immediateEffect: AbilityHelper.immediateEffects.sequential([
                    AbilityHelper.immediateEffects.damage((context) => ({ target: context.target, amount: 2 })),
                    AbilityHelper.immediateEffects.ready((context) => ({ target: context.target }))
                ])
            }
        });
    }

    protected override setupLeaderUnitSideAbilities() {
        this.addOnAttackAbility({
            title: 'Deal 1 damage to another friendly unit with 3 or less power and ready it.',
            optional: true,
            targetResolver: {
                controller: RelativePlayer.Self,
                cardTypeFilter: WildcardCardType.Unit,
                cardCondition: (card, context) => card !== context.source && card.isUnit() && card.getPower() <= 3,
                immediateEffect: AbilityHelper.immediateEffects.sequential([
                    AbilityHelper.immediateEffects.damage((context) => ({ target: context.target, amount: 1 })),
                    AbilityHelper.immediateEffects.ready((context) => ({ target: context.target })),
                ])
            }
        });
    }
}

GrandInquisitorHuntingTheJedi.implemented = true;
