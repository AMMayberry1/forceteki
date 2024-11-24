describe('Bossk, Deadly Stalker', function () {
    integration(function (contextRef) {
        describe('Bossk\'s ability', function () {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['smugglers-aid', 'tactical-advantage'],
                        groundArena: ['bossk#deadly-stalker'],
                    },
                    player2: {
                        hand: ['moment-of-peace'],
                        spaceArena: ['green-squadron-awing'],
                    }
                });
            });

            it('should deal 2 damage to a unit when controller plays events', function () {
                const { context } = contextRef;

                context.player1.clickCard(context.smugglersAid);
                // bossk triggers
                expect(context.player1).toBeAbleToSelectExactly([context.bossk, context.greenSquadronAwing]);
                expect(context.player1).toHavePassAbilityButton();
                context.player1.clickCard(context.greenSquadronAwing);
                expect(context.player2).toBeActivePlayer();
                expect(context.greenSquadronAwing.damage).toBe(2);

                // enemy plays event : nothing happens
                context.player2.clickCard(context.momentOfPeace);
                context.player2.clickCard(context.greenSquadronAwing);

                // play another event, bossk should trigger
                context.player1.clickCard(context.tacticalAdvantage);
                context.player1.clickCard(context.bossk);
                expect(context.player1).toBeAbleToSelectExactly([context.bossk, context.greenSquadronAwing]);
                expect(context.player1).toHavePassAbilityButton();
                context.player1.clickCard(context.greenSquadronAwing);

                // shield was destroyed
                expect(context.player2).toBeActivePlayer();
                expect(context.greenSquadronAwing.damage).toBe(2);
                expect(context.greenSquadronAwing.isUpgraded()).toBeFalse();
            });
        });
    });
});
