describe('Mace Windu, Vaapad Form Master', function () {
    integration(function (contextRef) {
        describe('Mace Windu\'s leader undeployed ability', function () {
            it('should deal 1 damage to a damaged enemy unit, if it has 5 damage on him, deal 1 damage more', function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        groundArena: [{ card: 'battlefield-marine', damage: 1 }],
                        leader: 'mace-windu#vaapad-form-master',
                        resources: 3,
                    },
                    player2: {
                        groundArena: [{ card: 'atst', damage: 4 }, 'wampa'],
                        spaceArena: [{ card: 'corellian-freighter', damage: 1 }]
                    },
                });

                const { context } = contextRef;

                context.player1.clickCard(context.maceWindu);

                // should be able to select damaged enemy unit
                expect(context.player1).toBeAbleToSelectExactly([context.atst, context.corellianFreighter]);
                context.player1.clickCard(context.corellianFreighter);

                // only 2 damage on corellian freighter, no more damage
                expect(context.corellianFreighter.damage).toBe(2);
                expect(context.player2).toBeActivePlayer();
                expect(context.maceWindu.exhausted).toBeTrue();
                expect(context.player1.exhaustedResourceCount).toBe(1);

                // reset
                context.maceWindu.exhausted = false;
                context.player2.passAction();

                context.player1.clickCard(context.maceWindu);
                expect(context.player1).toBeAbleToSelectExactly([context.atst, context.corellianFreighter]);
                context.player1.clickCard(context.atst);

                // 5 damage on atst, deal 1 damage more
                expect(context.atst.damage).toBe(6);
                expect(context.player2).toBeActivePlayer();
                expect(context.maceWindu.exhausted).toBeTrue();
                expect(context.player1.exhaustedResourceCount).toBe(2);
            });
        });

        describe('Mace Windu\'s leader deployed ability', function () {
            it('should deal 2 damage to each damaged enemy unit', function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        groundArena: [{ card: 'battlefield-marine', damage: 1 }],
                        leader: 'mace-windu#vaapad-form-master',
                        resources: 7,
                    },
                    player2: {
                        groundArena: [{ card: 'atst', damage: 4 }, 'wampa'],
                        spaceArena: [{ card: 'corellian-freighter', damage: 1 }]
                    },
                });

                const { context } = contextRef;

                // deploy mace windu
                context.player1.clickCard(context.maceWindu);
                context.player1.clickPrompt('Deploy Mace Windu');

                // deal 2 damage to each damaged enemy unit
                expect(context.atst.damage).toBe(6);
                expect(context.corellianFreighter.damage).toBe(3);
                expect(context.wampa.damage).toBe(0);
                expect(context.battlefieldMarine.damage).toBe(1);
                expect(context.player2).toBeActivePlayer();
            });
        });
    });
});
