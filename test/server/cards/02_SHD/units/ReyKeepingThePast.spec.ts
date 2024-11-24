describe('Rey, Keeping the Past', function() {
    integration(function(contextRef) {
        describe('Rey\'s Ability', function() {
            it('ignores Heroism aspect penalty when unit Kylo unit is controlled', function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['rey#keeping-the-past'],
                        groundArena: ['kylo-ren#killing-the-past', 'pyke-sentinel'],
                        base: 'dagobah-swamp',
                        leader: 'darth-vader#dark-lord-of-the-sith'
                    }
                });

                const { context } = contextRef;

                context.player1.clickCard(context.rey);

                // Rey should cost 5 since it ignores the villainy aspect
                expect(context.player1.exhaustedResourceCount).toBe(5);
            });

            it('heals 2 and gives Shield token to a non-heroism unit', function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        groundArena: ['rey#keeping-the-past', 'pyke-sentinel', 'battlefield-marine']
                    },
                    player2: {
                        groundArena: [{ card: 'wild-rancor', damage: 2 }, 'mandalorian-warrior']
                    }
                });

                const { context } = contextRef;

                const reset = (passAction = true) => {
                    context.rey.exhausted = false;
                    context.rey.damage = 0;
                    context.wildRancor.damage = 2;
                    if (passAction) {
                        context.player2.passAction();
                    }
                };

                context.setDamage(context.pykeSentinel, 2);
                context.player1.clickCard(context.rey);
                context.player1.clickCard(context.wildRancor);
                expect(context.player1).toBeAbleToSelectExactly([context.rey, context.pykeSentinel, context.wildRancor, context.battlefieldMarine, context.mandalorianWarrior]);
                context.player1.clickCard(context.pykeSentinel);
                expect(context.pykeSentinel.damage).toBe(0);
                expect(context.pykeSentinel).toHaveExactUpgradeNames(['shield']);

                // only heals 2 to a heroism unit
                reset(true);

                context.setDamage(context.battlefieldMarine, 2);
                context.player1.clickCard(context.rey);
                context.player1.clickCard(context.wildRancor);
                expect(context.player1).toBeAbleToSelectExactly([context.rey, context.pykeSentinel, context.wildRancor, context.battlefieldMarine, context.mandalorianWarrior]);

                context.player1.clickCard(context.battlefieldMarine);
                expect(context.battlefieldMarine.getHp()).toBe(3);
                expect(context.battlefieldMarine.isUpgraded()).toBeFalse(); // no shield

                // heals 2 and gives Shield token to an enemy non-heroism non-villany unit
                reset(true);

                context.player1.clickCard(context.rey);
                context.player1.clickCard(context.wildRancor);
                expect(context.player1).toHavePassAbilityButton();
                expect(context.player1).toBeAbleToSelectExactly([context.rey, context.pykeSentinel, context.wildRancor, context.battlefieldMarine, context.mandalorianWarrior]);
                context.player1.clickCard(context.mandalorianWarrior);

                expect(context.mandalorianWarrior).toHaveExactUpgradeNames(['shield']);
            });

            it('ignores Heroism aspect penalty when Kylo Ren is the leader', function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['rey#keeping-the-past'],
                        base: 'dagobah-swamp',
                        leader: 'kylo-ren#rash-and-deadly'
                    }
                });

                const { context } = contextRef;
                context.player1.clickCard(context.rey);
                // Rey should cost 5 since it ignores the heroism aspect due to Kylo Ren being the leader
                expect(context.player1.exhaustedResourceCount).toBe(5);
            });
        });
    });
});
