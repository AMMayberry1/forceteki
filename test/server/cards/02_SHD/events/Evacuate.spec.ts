describe('Evacuate', function() {
    integration(function(contextRef) {
        describe('Evacuate\'s ability', function() {
            it('should return all unit cards to hand and discard upgrades and ignore deployed leaders', function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['evacuate'],
                        groundArena: ['pyke-sentinel'],
                        spaceArena: ['cartel-spacer'],
                        leader: { card: 'finn#this-is-a-rescue', deployed: false },
                    },
                    player2: {
                        hand: ['death-star-stormtrooper'],
                        groundArena: ['wampa'],
                        spaceArena: [{ card: 'imperial-interceptor', upgrades: ['academy-training'] }],
                        leader: { card: 'grand-moff-tarkin#oversector-governor', deployed: true },
                    }
                });
                const { context } = contextRef;

                context.player1.clickCard('evacuate');
                expect(context.player1.hand).toHaveSize(2);
                expect(context.player1.hand).toContain(context.pykeSentinel);
                expect(context.player1.hand).toContain(context.cartelSpacer);
                expect(context.player1.hand).not.toContain(context.evacuate);
                expect(context.finn).toBeInZone('base');
                expect(context.player1.groundArena).toHaveSize(0);

                expect(context.player2.hand).toHaveSize(3);
                expect(context.player2.hand).toContain(context.deathStarStormtrooper);
                expect(context.player2.hand).toContain(context.wampa);
                expect(context.player2.hand).toContain(context.imperialInterceptor);
                expect(context.academyTraining).toBeInZone('discard');
                expect(context.grandMoffTarkin).toBeInZone('groundArena');
                expect(context.player2.groundArena).toHaveSize(1);

                // TODO CAPTURE: test that captured units are returned to the arena and not to hand
            });
        });
    });
});
