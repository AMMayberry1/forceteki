import { EventCard } from '../../../core/card/EventCard';
import AbilityHelper from '../../../AbilityHelper';
import { RelativePlayer, WildcardCardType } from '../../../core/Constants';

export default class SynchronizedStrike extends EventCard {
    protected override getImplementationId() {
        return {
            id: '0633620454',
            internalName: 'synchronized-strike'
        };
    }

    public override setupCardAbilities() {
        this.setEventAbility({
            title: 'Deal damage to an enemy unit equal to the number of units you control in its arena',
            targetResolver: {
                cardTypeFilter: WildcardCardType.Unit,
                controller: RelativePlayer.Opponent,
                immediateEffect: AbilityHelper.immediateEffects.damage((context) => ({
                    amount: context.source.controller.getUnitsInPlay(context.target.zoneName).length,
                }))
            }
        });
    }
}

SynchronizedStrike.implemented = true;
