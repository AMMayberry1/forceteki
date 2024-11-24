describe('Galactic Ambition', function () {
    integration(function (contextRef) {
        describe('Galactic Ambition\'s ability', function () {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['galactic-ambition', 'supreme-leader-snoke#shadow-ruler', 'redemption#medical-frigate', 'bounty-guild-initiate', 'i-am-your-father'],
                        base: 'kestro-city',
                        leader: 'grand-moff-tarkin#oversector-governor',
                        resources: 7
                    }
                });
            });

            it('should allow the controller to play a non-Heroism unit for free, and deal damage to their base equal to the printed cost', function () {
                const { context } = contextRef;

                context.player1.clickCard(context.galacticAmbition);
                expect(context.player1.exhaustedResourceCount).toBe(7);
                expect(context.player1).toBeAbleToSelectExactly([context.supremeLeaderSnoke, context.bountyGuildInitiate]);
                context.player1.clickCard(context.supremeLeaderSnoke);

                expect(context.supremeLeaderSnoke).toBeInZone('groundArena');
                expect(context.player1.exhaustedResourceCount).toBe(7);
                expect(context.p1Base.damage).toBe(8);
            });
        });
    });
});
