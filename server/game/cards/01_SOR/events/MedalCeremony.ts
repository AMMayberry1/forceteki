import AbilityHelper from '../../../AbilityHelper';
import { EventCard } from '../../../core/card/EventCard';
import { TargetMode, Trait } from '../../../core/Constants';
import { AttacksThisPhaseWatcher } from '../../../stateWatchers/AttacksThisPhaseWatcher';
import { StateWatcherRegistrar } from '../../../core/stateWatcher/StateWatcherRegistrar';

export default class MedalCeremony extends EventCard {
    private attacksThisPhaseWatcher: AttacksThisPhaseWatcher;

    protected override getImplementationId() {
        return {
            id: '4536594859',
            internalName: 'medal-ceremony',
        };
    }

    protected override setupStateWatchers(registrar: StateWatcherRegistrar) {
        this.attacksThisPhaseWatcher = AbilityHelper.stateWatchers.attacksThisPhase(registrar, this);
    }

    public override setupCardAbilities() {
        this.setEventAbility({
            title: 'Give an experience to each of up to three Rebel units that attacked this phase',
            targetResolver: {
                mode: TargetMode.UpTo,
                numCards: 3,
                canChooseNoCards: true,
                immediateEffect: AbilityHelper.immediateEffects.giveExperience(),
                cardCondition: (card, context) => {
                    const rebelUnitsAttackedThisPhase =
                        this.attacksThisPhaseWatcher.getAttackers((attack) => attack.attacker.hasSomeTrait(Trait.Rebel));
                    return rebelUnitsAttackedThisPhase.includes(card);
                }
            }
        });
    }
}

MedalCeremony.implemented = true;