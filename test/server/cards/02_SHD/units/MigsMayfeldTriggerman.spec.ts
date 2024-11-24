describe('Migs Mayfeld, Triggerman', function() {
    integration(function(contextRef) {
        describe('Migs Mayfeld\'s ability', function() {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['pillage', 'forced-surrender', 'no-bargain', 'commission', 'fell-the-dragon'],
                        groundArena: ['grogu#irresistible', 'migs-mayfeld#triggerman']
                    },
                    player2: {
                        hand: ['confiscate', 'daring-raid', 'krayt-dragon'],
                        groundArena: [{ card: 'wampa', upgrades: ['shield'] }],
                        spaceArena: ['system-patrol-craft']
                    }
                });
            });

            it('can deal two damage to a unit or base after a card is discarded from hand', function () {
                const { context } = contextRef;

                // CASE 1: Can deal two damage to a unit or base after a card is discarded from own hand and can optionally pass
                context.player1.clickCard(context.pillage);
                context.player1.clickPrompt('You');
                context.player1.clickCard(context.commission);
                context.player1.clickCard(context.fellTheDragon);
                context.player1.clickPrompt('Done');
                expect(context.player1).toBeAbleToSelectExactly([context.groguIrresistible, context.migsMayfeldTriggerman, context.wampa, context.systemPatrolCraft, context.p1Base, context.p2Base]);
                expect(context.player1).toHavePassAbilityButton();
                context.player1.clickCard(context.p2Base);
                expect(context.p2Base.damage).toBe(2);
                expect(context.player2).toBeActivePlayer();

                // CASE 2: Cannot use the ability twice in a round
                context.player2.passAction();
                context.player1.clickCard(context.forcedSurrender);
                context.player2.clickCard(context.confiscate);
                context.player2.clickCard(context.daringRaid);
                context.player2.clickPrompt('Done');
                expect(context.player2).toBeActivePlayer();

                // CASE 3: Is usable in the next round and from opponent discarding
                context.moveToNextActionPhase();
                context.player1.clickCard(context.noBargain);
                context.player2.clickCard(context.kraytDragon);
                expect(context.player1).toBeAbleToSelectExactly([context.groguIrresistible, context.migsMayfeldTriggerman, context.wampa, context.systemPatrolCraft, context.p1Base, context.p2Base]);
                context.player1.clickCard(context.systemPatrolCraft);
                expect(context.systemPatrolCraft.damage).toBe(2);

                // TODO: When Force Throw is implemented, ensure that Force Throw deals damage before the Migs trigger
            });
        });
    });
});
