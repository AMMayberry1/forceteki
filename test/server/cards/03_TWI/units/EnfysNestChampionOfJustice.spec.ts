describe('Enfys Nest, Champion of Justice', function () {
    integration(function (contextRef) {
        describe('Enfys Nest\'s ability', function () {
            it('can return an enemy non-leader unit with less power than this unit to its owner\'s hand', function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['enfys-nest#champion-of-justice', 'academy-training'],
                    },
                    player2: {
                        groundArena: ['battlefield-marine', 'wampa', 'atst', 'maul#shadow-collective-visionary']
                    }
                });

                const { context } = contextRef;

                context.player1.clickCard(context.enfysNest);

                // can bounce back unit which have power less or equal than 4
                expect(context.player1).toBeAbleToSelectExactly([context.battlefieldMarine, context.wampa]);
                expect(context.player1).toHavePassAbilityButton();
                context.player1.clickCard(context.wampa);

                expect(context.player2).toBeActivePlayer();
                expect(context.wampa).toBeInZone('hand');

                context.player2.passAction();

                // add power to enfysNest
                context.player1.clickCard(context.academyTraining);
                context.player1.clickCard(context.enfysNest);

                context.enfysNest.exhausted = false;
                context.player2.passAction();

                context.player1.clickCard(context.enfysNest);
                context.player1.clickCard(context.p2Base);
                context.player1.clickPrompt('Return an enemy non-leader unit with less power than this unit to its owner\'s hand');

                // can bounce back unit which have power less or equal than 6
                expect(context.player1).toBeAbleToSelectExactly([context.battlefieldMarine, context.atst]);
                expect(context.player1).toHavePassAbilityButton();
                context.player1.clickCard(context.atst);

                expect(context.player2).toBeActivePlayer();
                expect(context.atst).toBeInZone('hand');
            });
        });
    });
});
