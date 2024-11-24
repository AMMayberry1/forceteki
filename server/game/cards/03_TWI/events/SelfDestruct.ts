import { EventCard } from '../../../core/card/EventCard';
import AbilityHelper from '../../../AbilityHelper';
import { RelativePlayer, WildcardCardType } from '../../../core/Constants';

export default class SelfDestruct extends EventCard {
    protected override getImplementationId() {
        return {
            id: '8060312086',
            internalName: 'selfdestruct'
        };
    }

    public override setupCardAbilities() {
        this.setEventAbility({
            title: 'Defeat a friendly unit. If you do, deal 4 damage to a unit.',
            targetResolver: {
                cardTypeFilter: WildcardCardType.Unit,
                controller: RelativePlayer.Self,
                immediateEffect: AbilityHelper.immediateEffects.defeat()
            },
            ifYouDo: {
                title: 'Deal 4 damage to a unit',
                targetResolver: {
                    cardTypeFilter: WildcardCardType.Unit,
                    controller: RelativePlayer.Opponent,
                    immediateEffect: AbilityHelper.immediateEffects.damage({ amount: 4 })
                }
            }
        });
    }
}

SelfDestruct.implemented = true;
