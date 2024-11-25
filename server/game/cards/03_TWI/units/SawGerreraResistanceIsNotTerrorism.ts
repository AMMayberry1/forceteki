import AbilityHelper from '../../../AbilityHelper';
import { NonLeaderUnitCard } from '../../../core/card/NonLeaderUnitCard';
import { ZoneName } from '../../../core/Constants';

export default class SawGerreraResistanceIsNotTerrorism extends NonLeaderUnitCard {
    protected override getImplementationId() {
        return {
            id: '0354710662',
            internalName: 'saw-gerrera#resistance-is-not-terrorism',
        };
    }

    public override setupCardAbilities() {
        this.addOnAttackAbility({
            title: 'If your base has 15 or more damage on it, deal 1 damage to each enemy ground unit',
            immediateEffect: AbilityHelper.immediateEffects.conditional({
                condition: (context) => context.source.controller.base.damage >= 15,
                onFalse: AbilityHelper.immediateEffects.noAction(),
                onTrue: AbilityHelper.immediateEffects.damage((context) => ({
                    amount: 1,
                    target: context.source.controller.opponent.getUnitsInPlay(ZoneName.GroundArena)
                }))
            })
        });
    }
}

SawGerreraResistanceIsNotTerrorism.implemented = true;
