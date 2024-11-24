describe('Outland TIE Vanguard', function() {
    integration(function(contextRef) {
        describe('Outland TIE Vanguard\'s ability', function() {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['outland-tie-vanguard'],
                        groundArena: ['greedo#slow-on-the-draw', 'wampa'],
                    },
                    player2: {
                        spaceArena: ['green-squadron-awing']
                    }
                });
            });

            it('should give an experience when played.', function () {
                const { context } = contextRef;
                context.player1.clickCard(context.outlandTieVanguard);
                // should select ground unit of both players
                expect(context.player1).toBeAbleToSelectExactly([context.greedo, context.greenSquadronAwing]);
                expect(context.player1).toHavePassAbilityButton();
                context.player1.clickCard(context.greedo);
                expect(context.greedo).toHaveExactUpgradeNames(['experience']);
                expect(context.player2).toBeActivePlayer();
            });
        });
    });
});
