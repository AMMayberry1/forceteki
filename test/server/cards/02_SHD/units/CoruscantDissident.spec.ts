describe('Coruscant Dissident', function() {
    integration(function(contextRef) {
        beforeEach(function () {
            contextRef.setupTest({
                phase: 'action',
                player1: {
                    groundArena: [{ card: 'coruscant-dissident' }],
                },
            });
        });

        it('should ready a resource on attack', function () {
            const { context } = contextRef;

            context.player1.exhaustResources(2);

            context.player1.clickCard(context.coruscantDissident);
            expect(context.player1).toHavePassAbilityPrompt('Ready a resource');
            context.player1.clickPrompt('Ready a resource');
            expect(context.player1.exhaustedResourceCount).toBe(1);
        });
    });
});