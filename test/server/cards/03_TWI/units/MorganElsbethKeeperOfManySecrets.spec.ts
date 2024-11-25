describe('Morgan Elsbeth, Keeper of Many Secrets', function () {
    integration(function (contextRef) {
        describe('Morgan Elsbeth\'s ability', function () {
            it('should defeat another friendly unit and draw a card.', function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        groundArena: ['morgan-elsbeth#keeper-of-many-secrets', 'atst', 'wampa'],
                    },
                    player2: {
                        groundArena: ['battlefield-marine']
                    }
                });

                const { context } = contextRef;

                context.player1.clickCard(context.morganElsbeth);
                context.player1.clickCard(context.p2Base);

                // choice between ability and restore 1
                context.player1.clickPrompt('Defeat another friendly unit. If you do, draw a card.');
                expect(context.player1).toBeAbleToSelectExactly([context.wampa, context.atst]);
                expect(context.player1).toHavePassAbilityButton();
                context.player1.clickCard(context.wampa);

                // wampa should be defeated and we should had draw a card
                expect(context.player2).toBeActivePlayer();
                expect(context.wampa).toBeInZone('discard');
                expect(context.player1.hand.length).toBe(1);
            });
        });
    });
});
