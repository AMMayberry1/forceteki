describe('The Ghost, Spectre Home Base', function () {
    integration(function (contextRef) {
        describe('The Ghost\'s ability', function () {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['the-ghost#spectre-home-base'],
                        groundArena: ['21b-surgical-droid', 'sabine-wren#explosives-artist']
                    },
                    player2: {
                        groundArena: ['wampa', 'kanan-jarrus#revealed-jedi'],
                        spaceArena: ['green-squadron-awing']
                    }
                });
            });

            it('should give shield to an another spectre unit when played', function () {
                const { context } = contextRef;
                context.player1.clickCard(context.theGhost);

                // also shield
                context.player1.clickPrompt('Give a shield token to another Spectre unit');
                expect(context.player1).toBeAbleToSelectExactly([context.sabineWren, context.kananJarrus]);
                expect(context.player1).toHavePassAbilityButton();
                context.player1.clickCard(context.sabineWren);

                // sabine should have a shield
                expect(context.sabineWren).toHaveExactUpgradeNames(['shield']);
                expect(context.kananJarrus.isUpgraded()).toBeFalse();
                expect(context.player2).toBeActivePlayer();
            });
        });

        describe('The Ghost\'s ability', function () {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        groundArena: ['21b-surgical-droid', 'sabine-wren#explosives-artist'],
                        spaceArena: ['the-ghost#spectre-home-base']
                    },
                    player2: {
                        groundArena: ['wampa', 'kanan-jarrus#revealed-jedi'],
                        spaceArena: ['green-squadron-awing']
                    }
                });
            });

            it('should give shield to an another spectre unit on attack', function () {
                const { context } = contextRef;
                context.player1.clickCard(context.theGhost);
                context.player1.clickCard(context.p2Base);

                expect(context.player1).toBeAbleToSelectExactly([context.sabineWren, context.kananJarrus]);
                expect(context.player1).toHavePassAbilityButton();
                context.player1.clickCard(context.sabineWren);

                // sabine should have a shield
                expect(context.sabineWren).toHaveExactUpgradeNames(['shield']);
                expect(context.kananJarrus.isUpgraded()).toBeFalse();
                expect(context.player2).toBeActivePlayer();
            });
        });
    });
});
