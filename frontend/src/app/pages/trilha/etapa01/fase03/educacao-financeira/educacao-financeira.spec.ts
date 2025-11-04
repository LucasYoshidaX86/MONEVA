import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EducacaoFinanceira } from './educacao-financeira';

describe('EducacaoFinanceira', () => {
  let component: EducacaoFinanceira;
  let fixture: ComponentFixture<EducacaoFinanceira>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EducacaoFinanceira]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EducacaoFinanceira);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
