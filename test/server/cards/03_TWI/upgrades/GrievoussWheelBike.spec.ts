describe('Grievous\'s Wheel Bike', function() {
    integration(function(contextRef) {
        describe('Grievous\'s Wheel Bike\'s ability', function() {
            beforeEach(function () {
                contextRef.setupTest({
                    phase: 'action',
                    player1: {
                        hand: ['grievouss-wheel-bike'],
                        groundArena: ['snowspeeder', 'general-grievous#trophy-collector', 'battlefield-marine'],
                        leader: { card: 'general-grievous#general-of-the-droid-armies', deployed: true }
                    },
                    player2: {
                        groundArena: ['jedha-agitator']
                    }
                });
            });

            it('should give overwhelm to attached unit', function () {
                const { context } = contextRef;

                const grievousUnit = context.player1.findCardByName('general-grievous#trophy-collector');
                const grievousLeader = context.player1.findCardByName('general-grievous#general-of-the-droid-armies');

                // play wheel bike
                context.player1.clickCard(context.grievoussWheelBike);

                // able to select all non vehicle unit
                expect(context.player1).toBeAbleToSelectExactly([context.battlefieldMarine, context.jedhaAgitator, grievousLeader, grievousUnit]);
                context.player1.clickCard(context.battlefieldMarine);
                expect(context.player2).toBeActivePlayer();
                expect(context.player1.exhaustedResourceCount).toBe(4);
                context.player2.passAction();

                // attached unit should have +3+3 and overwhelm
                context.player1.clickCard(context.battlefieldMarine);
                context.player1.clickCard(context.jedhaAgitator);
                expect(context.player2).toBeActivePlayer();
                expect(context.p2Base.damage).toBe(5);
            });

            it('should cost 2 resource less to play on general grievous (unit)', function () {
                const { context } = contextRef;

                const grievousUnit = context.player1.findCardByName('general-grievous#trophy-collector');
                context.player1.clickCard(context.grievoussWheelBike);
                context.player1.clickCard(grievousUnit);

                // while playing on general grievous, it costs 2 resource less to play
                expect(context.player2).toBeActivePlayer();
                expect(context.player1.exhaustedResourceCount).toBe(2);
            });

            it('should cost 2 resource less to play on general grievous (leader)', function () {
                const { context } = contextRef;

                const grievousLeader = context.player1.findCardByName('general-grievous#general-of-the-droid-armies');
                context.player1.clickCard(context.grievoussWheelBike);
                context.player1.clickCard(grievousLeader);

                // while playing on general grievous, it costs 2 resource less to play
                expect(context.player2).toBeActivePlayer();
                expect(context.player1.exhaustedResourceCount).toBe(2);
            });
        });
    });
});
