describe('Count Dooku, Darth Tyranus', function () {
    integration(function (contextRef) {
        describe('Count Dooku\'s ability', function () {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['count-dooku#darth-tyranus'],
                        groundArena: ['21b-surgical-droid']
                    },
                    player2: {
                        groundArena: ['wampa', 'battlefield-marine', { card: 'atst', damage: 5 }, { card: 'echo-base-defender', upgrades: ['entrenched'] }],
                        spaceArena: ['green-squadron-awing']
                    }
                });
            });

            it('should defeat a unit with 4 or less remaining HP', function () {
                const { context } = contextRef;
                context.player1.clickCard(context.countDooku);

                // choose between defeat prompt and shield prompt
                context.player1.clickPrompt('Defeat a unit with 4 or less remaining HP');
                expect(context.player1).toBeAbleToSelectExactly([context._21bSurgicalDroid, context.greenSquadronAwing, context.battlefieldMarine, context.countDooku, context.atst]);
                expect(context.player1).toHavePassAbilityButton();
                context.player1.clickCard(context.battlefieldMarine);

                // only battlefield marine defeated
                expect(context.battlefieldMarine).toBeInZone('discard');
                expect(context._21bSurgicalDroid).toBeInZone('groundArena');
                expect(context.greenSquadronAwing).toBeInZone('spaceArena');
                expect(context.atst).toBeInZone('groundArena');
                expect(context.echoBaseDefender).toBeInZone('groundArena');
                expect(context.player2).toBeActivePlayer();
            });
        });
    });
});
