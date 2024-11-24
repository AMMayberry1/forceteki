import AbilityHelper from '../../../AbilityHelper';
import { NonLeaderUnitCard } from '../../../core/card/NonLeaderUnitCard';
import { RelativePlayer, WildcardCardType, ZoneName } from '../../../core/Constants';

export default class RazorCrest extends NonLeaderUnitCard {
    protected override getImplementationId () {
        return {
            id: '8142386948',
            internalName: 'razor-crest#reliable-gunship'
        };
    }

    public override setupCardAbilities () {
        this.addWhenPlayedAbility({
            title: 'Return an upgrade from your discard pile to your hand.',
            optional: true,
            targetResolver: {
                controller: RelativePlayer.Self,
                cardTypeFilter: WildcardCardType.Upgrade,
                zoneFilter: ZoneName.Discard,
                immediateEffect: AbilityHelper.immediateEffects.returnToHand()
            }
        });
    }
}

RazorCrest.implemented = true;
