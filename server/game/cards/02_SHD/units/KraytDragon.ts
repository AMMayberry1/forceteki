import AbilityHelper from '../../../AbilityHelper';
import { NonLeaderUnitCard } from '../../../core/card/NonLeaderUnitCard';
import { ZoneName, RelativePlayer } from '../../../core/Constants';
import * as AbilityLimit from '../../../core/ability/AbilityLimit';

export default class KraytDragon extends NonLeaderUnitCard {
    protected override getImplementationId() {
        return {
            id: '4935319539',
            internalName: 'krayt-dragon'
        };
    }

    public override setupCardAbilities() {
        this.addTriggeredAbility({
            title: 'Deal damage equal to that card’s cost to their base or a ground unit they control',
            when: {
                onCardPlayed: (event, context) => event.card.controller === context.source.controller.opponent,
            },
            optional: true,
            targetResolver: {
                controller: RelativePlayer.Opponent,
                zoneFilter: [ZoneName.GroundArena, ZoneName.Base],
                immediateEffect: AbilityHelper.immediateEffects.damage((context) => ({
                    amount: context.event.card.cost,
                }))
            }
        });
    }
}

KraytDragon.implemented = true;
