import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Trilha } from './trilha';

describe('Trilha', () => {
  let component: Trilha;
  let fixture: ComponentFixture<Trilha>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Trilha]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Trilha);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
