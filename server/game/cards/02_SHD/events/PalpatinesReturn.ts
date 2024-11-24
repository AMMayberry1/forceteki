import AbilityHelper from '../../../AbilityHelper';
import { EventCard } from '../../../core/card/EventCard';
import { CostAdjustType } from '../../../core/cost/CostAdjuster';
import { ZoneName, RelativePlayer, TargetMode, Trait, WildcardCardType } from '../../../core/Constants';

export default class PalpatinesReturn extends EventCard {
    protected override getImplementationId() {
        return {
            id: '4643489029',
            internalName: 'palpatines-return',
        };
    }

    public override setupCardAbilities() {
        this.setEventAbility({
            title: 'Play a unit from your discard pile. It costs 6 less. If it’s a Force unit, it costs 8 less instead.',
            targetResolver: {
                mode: TargetMode.Single,
                zoneFilter: ZoneName.Discard,
                controller: RelativePlayer.Self,
                cardTypeFilter: WildcardCardType.Unit,
                immediateEffect: AbilityHelper.immediateEffects.conditional({
                    condition: (context) => context.target.hasSomeTrait(Trait.Force),
                    onTrue: AbilityHelper.immediateEffects.playCardFromOutOfPlay({
                        adjustCost: { costAdjustType: CostAdjustType.Decrease, amount: 8 }
                    }),
                    onFalse: AbilityHelper.immediateEffects.playCardFromOutOfPlay({
                        adjustCost: { costAdjustType: CostAdjustType.Decrease, amount: 6 }
                    })
                }),
            }
        });
    }
}

PalpatinesReturn.implemented = true;
