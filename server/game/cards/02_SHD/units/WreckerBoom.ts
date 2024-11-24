import AbilityHelper from '../../../AbilityHelper';
import { NonLeaderUnitCard } from '../../../core/card/NonLeaderUnitCard';
import { RelativePlayer, WildcardCardType, ZoneName } from '../../../core/Constants';

export default class WreckerBoom extends NonLeaderUnitCard {
    protected override getImplementationId() {
        return {
            id: '2470093702',
            internalName: 'wrecker#boom'
        };
    }

    public override setupCardAbilities() {
        this.addWhenPlayedAbility({
            title: 'Defeat a friendly resource. If you do, deal 5 damage to a ground unit',
            optional: true,
            targetResolver: {
                controller: RelativePlayer.Self,
                zoneFilter: ZoneName.Resource,
                immediateEffect: AbilityHelper.immediateEffects.defeat()
            },
            ifYouDo: {
                title: 'Deal 5 damage to a ground unit',
                targetResolver: {
                    cardTypeFilter: WildcardCardType.Unit,
                    zoneFilter: ZoneName.GroundArena,
                    immediateEffect: AbilityHelper.immediateEffects.damage({ amount: 5 })
                }
            }
        });
    }
}

WreckerBoom.implemented = true;
