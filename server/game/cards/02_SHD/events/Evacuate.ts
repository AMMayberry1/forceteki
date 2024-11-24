import AbilityHelper from '../../../AbilityHelper';
import { EventCard } from '../../../core/card/EventCard';
import { RelativePlayer, Trait, WildcardCardType, WildcardZoneName } from '../../../core/Constants';

export default class Evacuate extends EventCard {
    protected override getImplementationId() {
        return {
            id: '8261033110',
            internalName: 'evacuate',
        };
    }

    public override setupCardAbilities() {
        this.setEventAbility({
            title: 'Return each non-leader unit to its owner\'s hand',
            immediateEffect: AbilityHelper.immediateEffects.returnToHand((context) => {
                // Reminder -- upgrades will get detached automatically during the leaves play handler
                const allUnits = context.player.getUnitsInPlay().concat(context.player.opponent.getUnitsInPlay());
                const allNonLeaderUnits = allUnits.filter((unit) => !unit.isLeaderUnit());
                return { target: allNonLeaderUnits };
            })
        });
    }
}

Evacuate.implemented = true;