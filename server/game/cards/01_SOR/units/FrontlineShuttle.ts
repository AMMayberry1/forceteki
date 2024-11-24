import AbilityHelper from '../../../AbilityHelper';
import { NonLeaderUnitCard } from '../../../core/card/NonLeaderUnitCard';
import { RelativePlayer } from '../../../core/Constants';

export default class FrontlineShuttle extends NonLeaderUnitCard {
    protected override getImplementationId() {
        return {
            id: '2471223947',
            internalName: 'frontline-shuttle',
        };
    }

    protected override setupCardAbilities() {
        this.addActionAbility({
            title: 'Attack with a unit, even if it’s exhausted. It can’t attack bases for this attack.',
            cost: AbilityHelper.costs.defeat({
                cardCondition: (card, context) => card === context.source,
                controller: RelativePlayer.Self,
            }),
            initiateAttack: {
                targetCondition: (target) => target.isUnit(),
                allowExhaustedAttacker: true
            }
        });
    }
}

FrontlineShuttle.implemented = true;
