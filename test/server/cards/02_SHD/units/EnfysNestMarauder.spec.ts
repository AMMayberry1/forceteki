describe('Enfys Nest, Marauder', function () {
    integration(function (contextRef) {
        describe('Enfys Nest\'s ability', function () {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['enfys-nest#marauder', 'syndicate-lackeys', 'liberated-slaves'],
                        groundArena: ['modded-cohort'],
                        base: 'energy-conversion-lab'
                    },
                    player2: {
                        groundArena: ['consular-security-force', 'atst'],
                        hand: ['4lom#bounty-hunter-for-hire']
                    }
                });
            });

            it('should give any unit attacked by the controller through an ambush ability -3/-0 for the duration of the attack', function () {
                const { context } = contextRef;

                const reset = () => {
                    context.atst.damage = 0;
                    context.consularSecurityForce.damage = 0;
                    context.player1.readyResources(10);
                    if (context.player2.actionPhaseActivePlayer === context.player2.player) {
                        context.player2.passAction();
                    }
                };

                // Case 1: Enfys applies its ability to itself
                context.player1.clickCard(context.enfysNest);
                context.player1.clickPrompt('Ambush');
                context.player1.clickCard(context.atst);

                expect(context.enfysNest.damage).toBe(3);
                expect(context.atst.damage).toBe(5);
                expect(context.atst.getPower()).toBe(6); // stat returns to normal after attack


                // Case 2: Ability applies to a played unit with printed ambush
                reset();
                context.player1.clickCard(context.syndicateLackeys);
                context.player1.clickPrompt('Ambush');
                context.player1.clickCard(context.atst);

                expect(context.syndicateLackeys.damage).toBe(3);


                // Case 3: Ability does not apply to a unit with printed ambush attacking normally
                reset();
                context.player1.clickCard(context.moddedCohort);
                context.player1.clickCard(context.consularSecurityForce);

                expect(context.moddedCohort.damage).toBe(3);
                expect(context.consularSecurityForce.damage).toBe(4);


                // Case 4: Ability applies to a unit played through an ambush-granting effect
                reset();
                context.player1.clickCard(context.energyConversionLab);
                expect(context.player1).toHavePassSingleTargetPrompt('Play a unit that costs 6 or less from your hand. Give it ambush for this phase', context.liberatedSlaves);
                context.player1.clickPrompt('Play a unit that costs 6 or less from your hand. Give it ambush for this phase -> Liberated Slaves');
                context.player1.clickPrompt('Ambush');
                context.player1.clickCard(context.atst);

                expect(context.liberatedSlaves.damage).toBe(3);


                // Case 5: Ability does not apply to opponent's unit attacking with ambush(or to that defender)
                context.liberatedSlaves.damage = 0;
                context.player2.clickCard(context._4lom);
                context.player2.clickPrompt('Ambush');
                context.player2.clickCard(context.liberatedSlaves);

                expect(context._4lom.damage).toBe(3);
                expect(context.liberatedSlaves.damage).toBe(4);
            });
        });
    });
});
