describe('Razor Crest', function () {
    integration(function (contextRef) {
        describe('Razor Crest\'s ability', function() {
            it('should return card to player hand from his discard pile', function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['razor-crest#reliable-gunship'],
                        groundArena: ['pyke-sentinel'],
                        discard: ['keep-fighting', 'green-squadron-awing', 'jedi-lightsaber', 'the-darksaber']
                    },
                    player2: {
                        discard: ['academy-training']
                    }
                });
                const { context } = contextRef;

                context.player1.clickCard(context.razorCrestReliableGunship);
                expect(context.player1).toBeAbleToSelectExactly([context.jediLightsaber, context.theDarksaber]);
                expect(context.player1).toHavePassAbilityButton();
                context.player1.clickCard(context.jediLightsaber);
                expect(context.player1.hand.length).toBe(1);
                expect(context.jediLightsaber.zoneName).toBe('hand');
            });

            it('should not do anything if no upgrade is in the discard pile', function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['razor-crest#reliable-gunship'],
                        groundArena: ['pyke-sentinel'],
                        discard: ['keep-fighting', 'green-squadron-awing']
                    },
                    player2: {
                        discard: ['academy-training']
                    }
                });
                const { context } = contextRef;

                context.player1.clickCard(context.razorCrestReliableGunship);
                expect(context.player2).toBeActivePlayer();
            });
        });
    });
});
