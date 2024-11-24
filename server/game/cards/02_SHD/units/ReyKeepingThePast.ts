import { NonLeaderUnitCard } from '../../../../../server/game/core/card/NonLeaderUnitCard';
import AbilityHelper from '../../../AbilityHelper';
import { Aspect, WildcardCardType, WildcardRelativePlayer } from '../../../core/Constants';

export default class ReyKeepingThePast extends NonLeaderUnitCard {
    protected override getImplementationId() {
        return {
            id: '0196346374',
            internalName: 'rey#keeping-the-past'
        };
    }

    public override setupCardAbilities() {
        this.addIgnoreSpecificAspectPenaltyAbility({
            title: 'While playing this unit, ignore her Heroism aspect penalty if you control Kylo Ren',
            ignoredAspects: Aspect.Heroism,
            condition: (context) => context.source.controller.controlsLeaderOrUnitWithTitle('Kylo Ren')
        });

        this.addOnAttackAbility({
            title: 'You may heal 2 damage from a unit. If it’s a non-Heroism unit, give a Shield token to it',
            optional: true,
            targetResolver: {
                controller: WildcardRelativePlayer.Any,
                cardTypeFilter: WildcardCardType.Unit,
                immediateEffect: AbilityHelper.immediateEffects.simultaneous([
                    AbilityHelper.immediateEffects.heal({ amount: 2 }),
                    AbilityHelper.immediateEffects.conditional({
                        condition: (context) => context.target.aspects.includes(Aspect.Heroism),
                        onTrue: AbilityHelper.immediateEffects.noAction(),
                        onFalse: AbilityHelper.immediateEffects.giveShield()
                    })
                ])
            },
        });
    }
}

ReyKeepingThePast.implemented = true;