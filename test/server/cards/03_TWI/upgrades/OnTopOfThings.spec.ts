describe('On Top of Things', function() {
    integration(function(contextRef) {
        describe('On Top of Things\' ability', function() {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['on-top-of-things'],
                        groundArena: ['battlefield-marine', 'wampa'],
                    },
                    player2: {
                        groundArena: ['atst']
                    }
                });
            });

            it('should make attached unit untargetable for this phase', function () {
                const { context } = contextRef;

                // add on top of things to wampa
                context.player1.clickCard(context.onTopOfThings);
                context.player1.clickCard(context.wampa);

                // atst cannot attack wampa
                context.player2.clickCard(context.atst);
                expect(context.player2).toBeAbleToSelectExactly([context.battlefieldMarine, context.p1Base]);
                context.player2.clickCard(context.p1Base);

                context.moveToNextActionPhase();
                context.player1.passAction();

                // next action phase, wampa can be attacked
                context.player2.clickCard(context.atst);
                expect(context.player2).toBeAbleToSelectExactly([context.battlefieldMarine, context.wampa, context.p1Base]);
                context.player2.clickCard(context.wampa);
                expect(context.wampa).toBeInZone('discard');
            });
        });
    });
});
