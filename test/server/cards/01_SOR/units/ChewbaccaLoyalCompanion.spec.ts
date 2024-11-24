describe('Chewbacca, Loyal Companion', function() {
    integration(function(contextRef) {
        describe('Chewbacca\'s when attacked ability', function() {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        groundArena: ['specforce-soldier', 'cantina-braggart']
                    },
                    player2: {
                        groundArena: [{ card: 'chewbacca#loyal-companion', exhausted: true }]
                    }
                });
            });

            it('readies Chewbacca when he is attacked', function () {
                const { context } = contextRef;

                expect(context.chewbacca.exhausted).toBe(true);
                context.player1.clickCard(context.specforceSoldier);
                // Don't need to click Chewbacca due to sentinel
                expect(context.chewbacca.exhausted).toBe(false);

                context.player2.clickCard(context.chewbacca);
                context.player2.clickCard(context.p1Base);
                expect(context.chewbacca.exhausted).toBe(true);

                context.player1.clickCard(context.cantinaBraggart);
                expect(context.chewbacca.exhausted).toBe(false);
            });
        });
    });
});
