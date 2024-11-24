describe('The Marauder, Shuttling The Bad Batch', function () {
    integration(function (contextRef) {
        describe('The Marauder\'s ability', function () {
            it('can heal a target unit for the amount of damage it has', function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['the-marauder#shuttling-the-bad-batch'],
                        groundArena: ['battlefield-marine'],
                        leader: { card: 'luke-skywalker#faithful-friend', deployed: true },
                        discard: ['luke-skywalker#jedi-knight', 'wampa', 'battlefield-marine']
                    },
                    player2: {
                        groundArena: ['wampa'],
                        discard: ['battlefield-marine']
                    }
                });

                const { context } = contextRef;

                // find duplicate
                const resourcedLuke = context.player1.findCardByName('luke-skywalker#jedi-knight', 'discard');
                const resourcedBattlefieldMarine = context.player1.findCardByName('battlefield-marine', 'discard');

                const resource = context.player1.resources.length;

                // play marauder
                context.player1.clickCard(context.theMarauder);

                // choose when played ability
                context.player1.clickPrompt('Put a card into play as a resource if it shares a name with a unit you control');

                // can select same unit or unit who share a name with a unit in play
                expect(context.player1).toBeAbleToSelectExactly([resourcedLuke, resourcedBattlefieldMarine]);

                // move luke to resources
                context.player1.clickCard(resourcedLuke);

                expect(context.player1.resources.length).toBe(resource + 1);
                expect(resourcedLuke).toBeInZone('resource');
                expect(context.player2).toBeActivePlayer();
            });
        });
    });
});
