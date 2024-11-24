import AbilityHelper from '../../../AbilityHelper';
import { NonLeaderUnitCard } from '../../../core/card/NonLeaderUnitCard';
import { Trait } from '../../../core/Constants';

export default class TheGhostSpectreHomeBase extends NonLeaderUnitCard {
    protected override getImplementationId() {
        return {
            id: '6931439330',
            internalName: 'the-ghost#spectre-home-base'
        };
    }

    public override setupCardAbilities() {
        this.addTriggeredAbility({
            title: 'Give a shield token to another Spectre unit',
            when: {
                onAttackDeclared: (event, context) => event.attack.attacker === context.source,
                onCardPlayed: (event, context) => event.card === context.source
            },
            optional: true,
            targetResolver: {
                cardCondition: (card, context) => card !== context.source && card.hasSomeTrait(Trait.Spectre),
                immediateEffect: AbilityHelper.immediateEffects.giveShield()
            }
        });
    }
}

TheGhostSpectreHomeBase.implemented = true;
