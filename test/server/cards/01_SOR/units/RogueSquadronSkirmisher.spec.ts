describe('Rogue Squadron Skirmisher', function () {
    integration(function (contextRef) {
        describe('Rogue Squadron Skirmisher\'s ability', function () {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['rogue-squadron-skirmisher'],
                        discard: ['battlefield-marine', 'rebel-assault', 'echo-base-defender', 'greedo#slow-on-the-draw']
                    },
                    player2: {
                        groundArena: ['consular-security-force']
                    }
                });
            });

            it('should trigger ambush and return a unit that costs 2 or less from discard pile', function () {
                const { context } = contextRef;

                context.player1.clickCard(context.rogueSquadronSkirmisher);

                // chooses to solve ambush first
                expect(context.player1).toHaveExactPromptButtons([
                    'Ambush',
                    'Return a unit that costs 2 or less from your discard pile to your hand.'
                ]);
                context.player1.clickPrompt('Ambush');

                // chooses to trigger the ambush
                expect(context.player1).toHaveExactPromptButtons([
                    'Ambush',
                    'Pass',
                ]);
                context.player1.clickPrompt('Ambush');

                // solves ambush damages
                expect(context.rogueSquadronSkirmisher.exhausted).toBeTrue();
                expect(context.consularSecurityForce.damage).toBe(4);
                expect(context.rogueSquadronSkirmisher.damage).toBe(3);

                // allows player to select which unit to return to hand
                expect(context.player1).toBeAbleToSelectExactly([context.battlefieldMarine, context.greedo]);
                context.player1.clickCard(context.battlefieldMarine);

                expect(context.battlefieldMarine).toBeInZone('hand');
                expect(context.greedo).toBeInZone('discard');

                expect(context.player2).toBeActivePlayer();
            });
        });

        describe('Rogue Squadron Skirmisher\'s ability', function () {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['rogue-squadron-skirmisher'],
                        discard: ['echo-base-defender', 'rebel-assault']
                    },
                    player2: {
                        groundArena: ['consular-security-force']
                    }
                });
            });

            it('should not return unit given discard pile has no eligible units', function () {
                const { context } = contextRef;

                context.player1.clickCard(context.rogueSquadronSkirmisher);

                // chooses to solve unit ability first
                expect(context.player1).toHaveExactPromptButtons([
                    'Ambush',
                    'Return a unit that costs 2 or less from your discard pile to your hand.'
                ]);
                context.player1.clickPrompt('Return a unit that costs 2 or less from your discard pile to your hand.');
                expect(context.player1.handSize).toBe(0);

                expect(context.player1).toHaveExactPromptButtons([
                    'Ambush',
                    'Pass',
                ]);
                context.player1.clickPrompt('Pass');

                expect(context.player2).toBeActivePlayer();
            });
        });
    });
});
