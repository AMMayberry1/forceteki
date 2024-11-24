import AbilityHelper from '../../../AbilityHelper';
import { NonLeaderUnitCard } from '../../../core/card/NonLeaderUnitCard';
import { CardType, RelativePlayer, WildcardCardType } from '../../../core/Constants';

export default class GreySquadronYWing extends NonLeaderUnitCard {
    protected override getImplementationId () {
        return {
            id: '9472541076',
            internalName: 'grey-squadron-ywing',
        };
    }

    public override setupCardAbilities () {
        this.addOnAttackAbility({
            title: 'Deal 2 damage to an opponent\s base or unit they control (they choose which)',
            targetResolver: {
                controller: RelativePlayer.Opponent,
                choosingPlayer: RelativePlayer.Opponent,
                cardTypeFilter: [WildcardCardType.Unit, CardType.Base],
                immediateEffect: AbilityHelper.immediateEffects.damage({ amount: 2 }),
            },
            optional: true,
        });
    }
}

GreySquadronYWing.implemented = true;
