describe('Clan Saxon Gauntlet', function () {
    integration(function (contextRef) {
        describe('Clan Saxon Gauntlet\'s ability', function () {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        spaceArena: ['clan-saxon-gauntlet'],
                        groundArena: ['swoop-racer']
                    },
                    player2: {
                        groundArena: ['battlefield-marine'],
                        spaceArena: ['green-squadron-awing', 'hwk290-freighter']
                    }
                });
            });

            it('should give an experience token to a unit when clan saxon gauntlet is attacked', function () {
                const { context } = contextRef;

                // attack something else, nothing happen
                context.player1.clickCard(context.swoopRacer);
                context.player1.clickCard(context.p2Base);

                // enemy attack something else, nothing happen
                context.player2.clickCard(context.battlefieldMarine);
                context.player2.clickCard(context.p1Base);
                context.player1.passAction();

                // unit attacks clan saxon gauntlet, should give an experience
                context.player2.clickCard(context.hwk290Freighter);
                expect(context.player1).toBeAbleToSelectExactly([context.clanSaxonGauntlet, context.swoopRacer, context.battlefieldMarine, context.greenSquadronAwing, context.hwk290Freighter]);
                expect(context.player1).toHavePassAbilityButton();

                // give the experience to himself, should kill hwk290
                context.player1.clickCard(context.clanSaxonGauntlet);
                expect(context.clanSaxonGauntlet.damage).toBe(2);
                expect(context.clanSaxonGauntlet).toHaveExactUpgradeNames(['experience']);
                expect(context.hwk290Freighter.zoneName).toBe('discard');
                context.player1.passAction();

                // unit attacks clan saxon gauntlet, should give an experience
                context.player2.clickCard(context.greenSquadronAwing);
                expect(context.player1).toBeAbleToSelectExactly([context.clanSaxonGauntlet, context.swoopRacer, context.battlefieldMarine, context.greenSquadronAwing]);
                expect(context.player1).toHavePassAbilityButton();

                // give the experience to a friendly unit
                context.player1.clickCard(context.swoopRacer);
                expect(context.clanSaxonGauntlet.damage).toBe(5);
                expect(context.clanSaxonGauntlet).toHaveExactUpgradeNames(['experience']);
                expect(context.swoopRacer).toHaveExactUpgradeNames(['experience']);
                expect(context.greenSquadronAwing.zoneName).toBe('discard');
            });
        });
    });
});
