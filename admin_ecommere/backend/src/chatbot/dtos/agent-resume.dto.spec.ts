import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AgentDecisionDto, ResumeAgentDto } from './agent-resume.dto';

describe('AgentDecisionDto', () => {
  it('should instantiate directly with assigned values', () => {
    const dto = new AgentDecisionDto();
    dto.callId = 'call_123456';
    dto.approve = true;

    expect(dto).toBeInstanceOf(AgentDecisionDto);
    expect(dto.callId).toBe('call_123456');
    expect(dto.approve).toBe(true);
  });

  describe('valid scenarios', () => {
    it('should pass validation with valid data (approve: true)', async () => {
      const dto = plainToInstance(AgentDecisionDto, {
        callId: 'call_1234567890abcdef',
        approve: true,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.callId).toBe('call_1234567890abcdef');
      expect(dto.approve).toBe(true);
    });

    it('should pass validation with valid data (approve: false)', async () => {
      const dto = plainToInstance(AgentDecisionDto, {
        callId: 'call_reject_123',
        approve: false,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.callId).toBe('call_reject_123');
      expect(dto.approve).toBe(false);
    });

    it('should pass validation when callId is exactly 128 characters', async () => {
      const callId128 = 'a'.repeat(128);
      const dto = plainToInstance(AgentDecisionDto, {
        callId: callId128,
        approve: true,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.callId).toBe(callId128);
    });
  });

  describe('validation failure scenarios', () => {
    describe('callId property', () => {
      it('should fail when callId is missing or undefined', async () => {
        const dto = plainToInstance(AgentDecisionDto, {
          approve: true,
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const callIdError = errors.find((e) => e.property === 'callId');
        expect(callIdError).toBeDefined();
        expect(callIdError?.constraints).toHaveProperty('isString');
        expect(callIdError?.constraints).toHaveProperty('isNotEmpty');
      });

      it('should fail when callId is an empty string', async () => {
        const dto = plainToInstance(AgentDecisionDto, {
          callId: '',
          approve: true,
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const callIdError = errors.find((e) => e.property === 'callId');
        expect(callIdError).toBeDefined();
        expect(callIdError?.constraints).toHaveProperty('isNotEmpty');
      });

      it.each([12345, true, false, {}, []])(
        'should fail when callId is not a string (%p)',
        async (invalidVal) => {
          const dto = plainToInstance(AgentDecisionDto, {
            callId: invalidVal,
            approve: true,
          });

          const errors = await validate(dto);
          expect(errors.length).toBeGreaterThan(0);
          const callIdError = errors.find((e) => e.property === 'callId');
          expect(callIdError).toBeDefined();
          expect(callIdError?.constraints).toHaveProperty('isString');
        },
      );

      it('should fail when callId exceeds 128 characters', async () => {
        const dto = plainToInstance(AgentDecisionDto, {
          callId: 'a'.repeat(129),
          approve: true,
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const callIdError = errors.find((e) => e.property === 'callId');
        expect(callIdError).toBeDefined();
        expect(callIdError?.constraints).toHaveProperty('maxLength');
      });
    });

    describe('approve property', () => {
      it('should fail when approve is missing or undefined', async () => {
        const dto = plainToInstance(AgentDecisionDto, {
          callId: 'call_123',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const approveError = errors.find((e) => e.property === 'approve');
        expect(approveError).toBeDefined();
        expect(approveError?.constraints).toHaveProperty('isBoolean');
      });

      it.each(['true', 'false', 1, 0, null, {}, []])(
        'should fail when approve is not a boolean (%p)',
        async (invalidVal) => {
          const dto = plainToInstance(AgentDecisionDto, {
            callId: 'call_123',
            approve: invalidVal,
          });

          const errors = await validate(dto);
          expect(errors.length).toBeGreaterThan(0);
          const approveError = errors.find((e) => e.property === 'approve');
          expect(approveError).toBeDefined();
          expect(approveError?.constraints).toHaveProperty('isBoolean');
        },
      );
    });
  });
});

describe('ResumeAgentDto', () => {
  it('should instantiate directly with assigned values', () => {
    const dto = new ResumeAgentDto();
    const decision = new AgentDecisionDto();
    decision.callId = 'call_001';
    decision.approve = true;
    dto.decisions = [decision];

    expect(dto).toBeInstanceOf(ResumeAgentDto);
    expect(dto.decisions).toHaveLength(1);
    expect(dto.decisions[0]).toBeInstanceOf(AgentDecisionDto);
    expect(dto.decisions[0].callId).toBe('call_001');
    expect(dto.decisions[0].approve).toBe(true);
  });

  describe('valid scenarios', () => {
    it('should pass validation with a single valid decision', async () => {
      const dto = plainToInstance(ResumeAgentDto, {
        decisions: [{ callId: 'call_123', approve: true }],
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.decisions).toHaveLength(1);
      expect(dto.decisions[0]).toBeInstanceOf(AgentDecisionDto);
      expect(dto.decisions[0].callId).toBe('call_123');
      expect(dto.decisions[0].approve).toBe(true);
    });

    it('should pass validation with multiple valid decisions', async () => {
      const dto = plainToInstance(ResumeAgentDto, {
        decisions: [
          { callId: 'call_1', approve: true },
          { callId: 'call_2', approve: false },
        ],
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.decisions).toHaveLength(2);
      expect(dto.decisions[0]).toBeInstanceOf(AgentDecisionDto);
      expect(dto.decisions[1]).toBeInstanceOf(AgentDecisionDto);
      expect(dto.decisions[0].approve).toBe(true);
      expect(dto.decisions[1].approve).toBe(false);
    });

    it('should pass validation with maximum 12 decisions (upper boundary)', async () => {
      const items = Array.from({ length: 12 }, (_, i) => ({
        callId: `call_${i + 1}`,
        approve: i % 2 === 0,
      }));

      const dto = plainToInstance(ResumeAgentDto, {
        decisions: items,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.decisions).toHaveLength(12);
      expect(dto.decisions[11]).toBeInstanceOf(AgentDecisionDto);
      expect(dto.decisions[11].callId).toBe('call_12');
    });
  });

  describe('validation failure scenarios', () => {
    describe('decisions property', () => {
      it('should fail when decisions is missing or undefined', async () => {
        const dto = plainToInstance(ResumeAgentDto, {});

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const decisionsError = errors.find((e) => e.property === 'decisions');
        expect(decisionsError).toBeDefined();
        expect(decisionsError?.constraints).toHaveProperty('isArray');
      });

      it.each(['not-an-array', 123, true, false, {}, null])(
        'should fail when decisions is not an array (%p)',
        async (invalidVal) => {
          const dto = plainToInstance(ResumeAgentDto, {
            decisions: invalidVal,
          });

          const errors = await validate(dto);
          expect(errors.length).toBeGreaterThan(0);
          const decisionsError = errors.find((e) => e.property === 'decisions');
          expect(decisionsError).toBeDefined();
          expect(decisionsError?.constraints).toHaveProperty('isArray');
        },
      );

      it('should fail when decisions array is empty (lower boundary violation)', async () => {
        const dto = plainToInstance(ResumeAgentDto, {
          decisions: [],
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const decisionsError = errors.find((e) => e.property === 'decisions');
        expect(decisionsError).toBeDefined();
        expect(decisionsError?.constraints).toHaveProperty('arrayMinSize');
      });

      it('should fail when decisions array exceeds 12 items (upper boundary violation)', async () => {
        const items = Array.from({ length: 13 }, (_, i) => ({
          callId: `call_${i + 1}`,
          approve: true,
        }));

        const dto = plainToInstance(ResumeAgentDto, {
          decisions: items,
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const decisionsError = errors.find((e) => e.property === 'decisions');
        expect(decisionsError).toBeDefined();
        expect(decisionsError?.constraints).toHaveProperty('arrayMaxSize');
      });
    });

    describe('nested decisions validation', () => {
      it('should fail validation when a nested decision has missing callId', async () => {
        const dto = plainToInstance(ResumeAgentDto, {
          decisions: [{ approve: true }],
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const decisionsError = errors.find((e) => e.property === 'decisions');
        expect(decisionsError).toBeDefined();
        expect(decisionsError?.children).toBeDefined();
        expect(decisionsError!.children!.length).toBeGreaterThan(0);
        const childCallIdError = decisionsError!.children![0].children!.find(
          (e) => e.property === 'callId',
        );
        expect(childCallIdError).toBeDefined();
        expect(childCallIdError?.constraints).toHaveProperty('isNotEmpty');
      });

      it('should fail validation when a nested decision has invalid approve', async () => {
        const dto = plainToInstance(ResumeAgentDto, {
          decisions: [{ callId: 'call_123', approve: 'invalid' }],
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const decisionsError = errors.find((e) => e.property === 'decisions');
        expect(decisionsError).toBeDefined();
        expect(decisionsError?.children).toBeDefined();
        expect(decisionsError!.children!.length).toBeGreaterThan(0);
        const childApproveError = decisionsError!.children![0].children!.find(
          (e) => e.property === 'approve',
        );
        expect(childApproveError).toBeDefined();
        expect(childApproveError?.constraints).toHaveProperty('isBoolean');
      });

      it('should fail validation when a nested decision has callId exceeding max length', async () => {
        const dto = plainToInstance(ResumeAgentDto, {
          decisions: [{ callId: 'x'.repeat(129), approve: false }],
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const decisionsError = errors.find((e) => e.property === 'decisions');
        expect(decisionsError).toBeDefined();
        expect(decisionsError?.children).toBeDefined();
        expect(decisionsError!.children!.length).toBeGreaterThan(0);
        const childCallIdError = decisionsError!.children![0].children!.find(
          (e) => e.property === 'callId',
        );
        expect(childCallIdError).toBeDefined();
        expect(childCallIdError?.constraints).toHaveProperty('maxLength');
      });
    });
  });
});
