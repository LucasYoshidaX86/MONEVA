import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControleGastos } from './controle-gastos';

describe('ControleGastos', () => {
  let component: ControleGastos;
  let fixture: ComponentFixture<ControleGastos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ControleGastos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ControleGastos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
